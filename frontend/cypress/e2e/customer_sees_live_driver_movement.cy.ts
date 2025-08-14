describe('Customer Sees Live Driver Movement', () => {
  const testOrderId = 'test-order-123'
  
  beforeEach(() => {
    // Clear any existing data
    cy.clearLocalStorage()
    cy.clearCookies()
    
    // Mock the order data for testing
    cy.intercept('GET', `/api/orders/${testOrderId}`, {
      statusCode: 200,
      body: {
        id: testOrderId,
        status: 'out_for_delivery',
        created_at: new Date().toISOString(),
        payment_status: 'paid',
        payment_method: 'cash',
        total_amount: 5000,
        delivery_fee: 500,
        delivery_address: {
          landmark: 'Test Landmark',
          latitude: 4.0511,
          longitude: 9.7679,
          contact_number: '123456789'
        },
        items: [
          {
            id: 'item-1',
            quantity: 2,
            product: {
              name: 'Test Product',
              price: 2250,
              images: [{ image: '/placeholder.svg' }]
            }
          }
        ]
      }
    }).as('getOrder')
    
    // Mock WebSocket connection
    cy.window().then((win) => {
      // Mock WebSocket
      const mockWebSocket = {
        readyState: 1, // OPEN
        send: cy.stub().as('wsSend'),
        close: cy.stub().as('wsClose'),
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null
      }
      
      // Override WebSocket constructor
      cy.stub(win, 'WebSocket').returns(mockWebSocket)
      
      // Simulate WebSocket connection
      setTimeout(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen()
        }
      }, 100)
      return win
    })
  })

  it('should automatically open tracking map when order status is out_for_delivery', () => {
    // Visit the order tracking page
    cy.visit(`/order/${testOrderId}`)
    
    // Wait for order data to load
    cy.wait('@getOrder')
    
    // Verify the tracking map is automatically displayed
    cy.get('[data-testid="tracking-map"]').should('be.visible')
    
    // Check that the map container exists
    cy.get('.mapboxgl-map').should('exist')
    
    // Verify the live tracking indicator is shown
    cy.get('[data-testid="live-tracking-indicator"]').should('exist')
    cy.contains('LIVE').should('be.visible')
  })

  it('should display real-time delivery tracking information', () => {
    cy.visit(`/order/${testOrderId}`)
    cy.wait('@getOrder')
    
    // Check for ETA display
    cy.get('[data-testid="eta-display"]').should('exist')
    
    // Check for distance display
    cy.get('[data-testid="distance-display"]').should('exist')
    
    // Check for speed display
    cy.get('[data-testid="speed-display"]').should('exist')
    
    // Check for connection status
    cy.get('[data-testid="connection-status"]').should('exist')
  })

  it('should show delivery agent information', () => {
    cy.visit(`/order/${testOrderId}`)
    cy.wait('@getOrder')
    
    // Check for delivery agent section
    cy.contains('Delivery Agent').should('be.visible')
    
    // Verify agent name is displayed
    cy.get('[data-testid="delivery-agent-name"]').should('exist')
  })

  it('should display map markers for pickup and delivery locations', () => {
    cy.visit(`/order/${testOrderId}`)
    cy.wait('@getOrder')
    
    // Wait for map to load
    cy.get('.mapboxgl-map').should('exist')
    
    // Check for markers (pickup and delivery)
    cy.get('.mapboxgl-marker').should('have.length.at.least', 2)
    
    // Verify pickup marker (green)
    cy.get('.mapboxgl-marker').first().should('exist')
    
    // Verify delivery marker (red)
    cy.get('.mapboxgl-marker').last().should('exist')
  })

  it('should show route between pickup and delivery locations', () => {
    cy.visit(`/order/${testOrderId}`)
    cy.wait('@getOrder')
    
    // Wait for map and route to load
    cy.get('.mapboxgl-map').should('exist')
    
    // Check for route line (this may take a moment to render)
    cy.get('.mapboxgl-canvas').should('exist')
    
    // Verify route is displayed (check for route source)
    cy.window().then((win) => {
      const map = win.mapboxgl?.Map?.instances?.[0]
      if (map) {
        expect(map.getSource('route')).to.exist
      }
      return win
    })
  })

  it('should handle WebSocket connection status changes', () => {
    cy.visit(`/order/${testOrderId}`)
    cy.wait('@getOrder')
    
    // Initially should show connecting status
    cy.get('[data-testid="connection-status"]').should('exist')
    
    // After WebSocket connects, should show live status
    cy.contains('Live Tracking').should('be.visible')
    
    // Verify WebSocket connection is established
    cy.window().then((win) => {
      expect(win.WebSocket).to.exist
      return win
    })
  })

  it('should display real-time location updates', () => {
    cy.visit(`/order/${testOrderId}`)
    cy.wait('@getOrder')
    
    // Mock location update
    cy.window().then((win) => {
      const mockWebSocket = win.WebSocket.instances?.[0]
      if (mockWebSocket && mockWebSocket.onmessage) {
        const locationUpdate = {
          type: 'location_update',
          lat: 4.0512,
          lon: 9.7680,
          bearing: 45,
          speed: 25,
          timestamp: new Date().toISOString()
        }
        
        mockWebSocket.onmessage({ data: JSON.stringify(locationUpdate) })
      }
      return win
    })
    
    // Verify location update is processed
    cy.get('[data-testid="current-location"]').should('exist')
  })

  it('should show ETA updates in real-time', () => {
    cy.visit(`/order/${testOrderId}`)
    cy.wait('@getOrder')
    
    // Mock ETA update
    cy.window().then((win) => {
      const mockWebSocket = win.WebSocket.instances?.[0]
      if (mockWebSocket && mockWebSocket.onmessage) {
        const etaUpdate = {
          type: 'eta_update',
          eta_minutes: 15,
          distance_km: 2.5,
          current_speed: 30,
          timestamp: new Date().toISOString()
        }
        
        mockWebSocket.onmessage({ data: JSON.stringify(etaUpdate) })
      }
      return win
    })
    
    // Verify ETA is updated
    cy.get('[data-testid="eta-display"]').should('contain', '15')
    cy.get('[data-testid="distance-display"]').should('contain', '2.5')
  })

  it('should handle WebSocket disconnection gracefully', () => {
    cy.visit(`/order/${testOrderId}`)
    cy.wait('@getOrder')
    
    // Initially connected
    cy.contains('Live Tracking').should('be.visible')
    
    // Simulate disconnection
    cy.window().then((win) => {
      const mockWebSocket = win.WebSocket.instances?.[0]
      if (mockWebSocket && mockWebSocket.onclose) {
        mockWebSocket.onclose()
      }
      return win
    })
    
    // Should show disconnected status
    cy.contains('Static View').should('be.visible')
  })

  it('should maintain map state during WebSocket reconnection', () => {
    cy.visit(`/order/${testOrderId}`)
    cy.wait('@getOrder')
    
    // Verify map is loaded
    cy.get('.mapboxgl-map').should('exist')
    
    // Disconnect WebSocket
    cy.window().then((win) => {
      const mockWebSocket = win.WebSocket.instances?.[0]
      if (mockWebSocket && mockWebSocket.onclose) {
        mockWebSocket.onclose()
      }
      return win
    })
    
    // Map should still be visible
    cy.get('.mapboxgl-map').should('exist')
    
    // Reconnect WebSocket
    cy.window().then((win) => {
      const mockWebSocket = win.WebSocket.instances?.[0]
      if (mockWebSocket && mockWebSocket.onopen) {
        mockWebSocket.onopen()
      }
      return win
    })
    
    // Should show live tracking again
    cy.contains('Live Tracking').should('be.visible')
  })

  it('should display appropriate error messages for failed connections', () => {
    // Mock WebSocket error
    cy.window().then((win) => {
      const mockWebSocket = {
        readyState: 3, // CLOSED
        send: cy.stub().as('wsSend'),
        close: cy.stub().as('wsClose'),
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null
      }
      
      cy.stub(win, 'WebSocket').returns(mockWebSocket)
      return win
    })
    
    cy.visit(`/order/${testOrderId}`)
    cy.wait('@getOrder')
    
    // Should show error or disconnected status
    cy.contains('Static View').should('be.visible')
  })
})

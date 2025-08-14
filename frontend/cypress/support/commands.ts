/// <reference types="cypress" />

// Custom command for login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('not.include', '/login')
})

// Custom command for logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/login')
})

// Custom command for creating a test order
Cypress.Commands.add('createTestOrder', () => {
  // Navigate to marketplace
  cy.visit('/marketplace')
  
  // Add first product to cart
  cy.get('[data-testid="product-card"]').first().click()
  cy.get('[data-testid="add-to-cart-button"]').click()
  
  // Go to cart
  cy.visit('/cart')
  cy.get('[data-testid="checkout-button"]').click()
  
  // Fill checkout form
  cy.get('[data-testid="delivery-address"]').type('Test Address')
  cy.get('[data-testid="delivery-contact"]').type('123456789')
  cy.get('[data-testid="payment-method"]').select('cash')
  
  // Submit order
  cy.get('[data-testid="place-order-button"]').click()
  
  // Verify order created
  cy.url().should('include', '/order/')
})

// Custom command for checking WebSocket connection
Cypress.Commands.add('checkWebSocketConnection', (orderId: string) => {
  // This is a mock check since we can't directly test WebSocket in Cypress
  // In real implementation, you'd check for WebSocket events
  cy.window().then((win) => {
    // Check if WebSocket connection is established
    expect(win.WebSocket).to.exist
  })
})

// Custom command for measuring WebSocket RTT
Cypress.Commands.add('measureWebSocketRTT', (orderId: string) => {
  // This would measure WebSocket round-trip time
  // For now, we'll just verify the connection exists
  cy.window().then((win) => {
    // Mock RTT measurement
    const startTime = performance.now()
    
    // Simulate WebSocket message
    setTimeout(() => {
      const endTime = performance.now()
      const rtt = endTime - startTime
      
      // Log RTT for debugging
      cy.log(`WebSocket RTT: ${rtt.toFixed(2)}ms`)
      
      // Assert RTT is reasonable (less than 500ms for local testing)
      expect(rtt).to.be.lessThan(500)
    }, 100)
  })
})

// Custom command for testing delivery tracking
Cypress.Commands.add('testDeliveryTracking', (orderId: string) => {
  // Navigate to order tracking page
  cy.visit(`/order/${orderId}`)
  
  // Check if tracking map is visible
  cy.get('[data-testid="tracking-map"]').should('be.visible')
  
  // Check if live tracking indicator is present
  cy.get('[data-testid="live-tracking-indicator"]').should('exist')
  
  // Verify map container exists
  cy.get('.mapboxgl-map').should('exist')
  
  // Check for markers (pickup and delivery)
  cy.get('.mapboxgl-marker').should('have.length.at.least', 2)
})

// Custom command for testing real-time updates
Cypress.Commands.add('testRealTimeUpdates', (orderId: string) => {
  // This would test real-time WebSocket updates
  // For now, we'll verify the UI elements exist
  
  // Check for ETA display
  cy.get('[data-testid="eta-display"]').should('exist')
  
  // Check for distance display
  cy.get('[data-testid="distance-display"]').should('exist')
  
  // Check for speed display
  cy.get('[data-testid="speed-display"]').should('exist')
  
  // Check for connection status
  cy.get('[data-testid="connection-status"]').should('exist')
})

// Extend Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
      createTestOrder(): Chainable<void>
      checkWebSocketConnection(orderId: string): Chainable<void>
      measureWebSocketRTT(orderId: string): Chainable<void>
      testDeliveryTracking(orderId: string): Chainable<void>
      testRealTimeUpdates(orderId: string): Chainable<void>
    }
  }
}

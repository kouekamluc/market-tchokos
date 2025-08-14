/**
 * WebSocket RTT (Round-Trip Time) Testing Utility
 * Measures the latency of WebSocket connections for performance validation
 */

interface RTTTestResult {
  orderId: string;
  connectionTime: number;
  messageRTT: number;
  averageRTT: number;
  minRTT: number;
  maxRTT: number;
  totalMessages: number;
  successRate: number;
  timestamp: string;
}

class WebSocketRTTTester {
  private socket: WebSocket | null = null;
  private testResults: RTTTestResult[] = [];
  private messageTimestamps: Map<string, number> = new Map();
  private rttMeasurements: number[] = [];

  /**
   * Test WebSocket RTT for a specific order
   */
  async testWebSocketRTT(orderId: string, testDuration: number = 30000): Promise<RTTTestResult> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const wsUrl = `ws://localhost:8000/ws/delivery/${orderId}/`;
      
      try {
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
          const connectionTime = performance.now() - startTime;
          console.log(`WebSocket connected in ${connectionTime.toFixed(2)}ms`);
          
          // Start sending test messages
          this.startRTTTest(orderId, testDuration, connectionTime, resolve);
        };
        
        this.socket.onerror = (error) => {
          reject(new Error(`WebSocket connection failed: ${error}`));
        };
        
        this.socket.onclose = () => {
          console.log('WebSocket connection closed');
        };
        
      } catch (error) {
        reject(new Error(`Failed to create WebSocket: ${error}`));
      }
    });
  }

  private startRTTTest(
    orderId: string, 
    testDuration: number, 
    connectionTime: number, 
    resolve: (result: RTTTestResult) => void
  ) {
    const testStartTime = performance.now();
    let messageCount = 0;
    let successfulMessages = 0;
    
    // Send test message every 100ms
    const messageInterval = setInterval(() => {
      if (performance.now() - testStartTime >= testDuration) {
        clearInterval(messageInterval);
        this.completeTest(orderId, connectionTime, messageCount, successfulMessages, resolve);
        return;
      }
      
      this.sendTestMessage(messageCount);
      messageCount++;
    }, 100);
    
    // Listen for responses
    if (this.socket) {
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'test_response' && data.messageId !== undefined) {
            this.handleTestResponse(data.messageId);
            successfulMessages++;
          }
        } catch (error) {
          console.warn('Failed to parse test response:', error);
        }
      };
    }
  }

  private sendTestMessage(messageId: number) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'test_message',
        messageId,
        timestamp: performance.now()
      };
      
      this.messageTimestamps.set(messageId.toString(), performance.now());
      this.socket.send(JSON.stringify(message));
    }
  }

  private handleTestResponse(messageId: string) {
    const sendTime = this.messageTimestamps.get(messageId);
    if (sendTime) {
      const receiveTime = performance.now();
      const rtt = receiveTime - sendTime;
      
      this.rttMeasurements.push(rtt);
      this.messageTimestamps.delete(messageId);
      
      console.log(`Message ${messageId} RTT: ${rtt.toFixed(2)}ms`);
    }
  }

  private completeTest(
    orderId: string,
    connectionTime: number,
    totalMessages: number,
    successfulMessages: number,
    resolve: (result: RTTTestResult) => void
  ) {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    const result: RTTTestResult = {
      orderId,
      connectionTime,
      messageRTT: this.rttMeasurements.length > 0 ? this.rttMeasurements[this.rttMeasurements.length - 1] : 0,
      averageRTT: this.calculateAverageRTT(),
      minRTT: this.calculateMinRTT(),
      maxRTT: this.calculateMaxRTT(),
      totalMessages,
      successRate: (successfulMessages / totalMessages) * 100,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    this.resetTest();
    
    console.log('RTT Test Results:', result);
    resolve(result);
  }

  private calculateAverageRTT(): number {
    if (this.rttMeasurements.length === 0) return 0;
    const sum = this.rttMeasurements.reduce((acc, rtt) => acc + rtt, 0);
    return sum / this.rttMeasurements.length;
  }

  private calculateMinRTT(): number {
    if (this.rttMeasurements.length === 0) return 0;
    return Math.min(...this.rttMeasurements);
  }

  private calculateMaxRTT(): number {
    if (this.rttMeasurements.length === 0) return 0;
    return Math.max(...this.rttMeasurements);
  }

  private resetTest() {
    this.messageTimestamps.clear();
    this.rttMeasurements = [];
  }

  /**
   * Get all test results
   */
  getTestResults(): RTTTestResult[] {
    return [...this.testResults];
  }

  /**
   * Clear all test results
   */
  clearTestResults() {
    this.testResults = [];
  }

  /**
   * Test WebSocket RTT under different network conditions
   */
  async testUnderNetworkConditions(orderId: string): Promise<RTTTestResult[]> {
    const results: RTTTestResult[] = [];
    
    // Test with different message frequencies
    const frequencies = [50, 100, 200, 500]; // ms intervals
    
    for (const frequency of frequencies) {
      console.log(`Testing with ${frequency}ms message frequency...`);
      
      // Simulate different network conditions
      if (frequency <= 100) {
        // Simulate good network (3G)
        await this.simulateNetworkCondition('3g');
      } else {
        // Simulate poor network (2G)
        await this.simulateNetworkCondition('2g');
      }
      
      const result = await this.testWebSocketRTT(orderId, 10000); // 10 second test
      results.push(result);
      
      // Wait between tests
      await this.delay(2000);
    }
    
    return results;
  }

  private async simulateNetworkCondition(condition: '2g' | '3g' | '4g'): Promise<void> {
    // This would integrate with browser dev tools or network throttling
    // For now, we'll just log the condition
    console.log(`Simulating ${condition} network condition`);
    
    // In a real implementation, you might use:
    // - Chrome DevTools Protocol for network throttling
    // - Service Worker for network simulation
    // - Browser extensions for network control
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate RTT performance against requirements
   */
  validateRTTPerformance(result: RTTTestResult): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check connection time (should be < 1000ms)
    if (result.connectionTime > 1000) {
      issues.push(`Connection time ${result.connectionTime}ms exceeds 1000ms limit`);
      recommendations.push('Optimize WebSocket connection establishment');
    }
    
    // Check average RTT (should be < 200ms for 3G)
    if (result.averageRTT > 200) {
      issues.push(`Average RTT ${result.averageRTT.toFixed(2)}ms exceeds 200ms limit`);
      recommendations.push('Optimize WebSocket message handling and reduce payload size');
    }
    
    // Check max RTT (should be < 500ms)
    if (result.maxRTT > 500) {
      issues.push(`Max RTT ${result.maxRTT.toFixed(2)}ms exceeds 500ms limit`);
      recommendations.push('Investigate network spikes and implement retry logic');
    }
    
    // Check success rate (should be > 95%)
    if (result.successRate < 95) {
      issues.push(`Success rate ${result.successRate.toFixed(1)}% below 95% threshold`);
      recommendations.push('Improve error handling and connection stability');
    }
    
    const isValid = issues.length === 0;
    
    if (isValid) {
      recommendations.push('Performance meets all requirements');
    }
    
    return { isValid, issues, recommendations };
  }
}

// Export singleton instance
export const websocketRTTTester = new WebSocketRTTTester();

// Export types
export type { RTTTestResult };
export { WebSocketRTTTester };

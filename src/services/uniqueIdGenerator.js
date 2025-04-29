/**
 * A utility for generating unique request IDs for Deriv API requests.
 * This ensures each API request has a traceable, unique identifier.
 */

const RequestIdGenerator = {
    // Keep a record of generated IDs to ensure uniqueness
    usedIds: new Set(),
    
    // Counter to help ensure uniqueness even with timestamp collisions
    counter: 0,
  
    /**
     * Generates a unique request ID for Deriv API calls
     * Format: prefix_timestamp_random_counter
     * 
     * @param {string} prefix - Optional prefix to categorize request types (e.g., 'trade', 'price', 'account')
     * @returns {string} - A unique request ID
     */
    generate(prefix = 'req') {
      const timestamp = Date.now();
      const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const countPart = (this.counter++).toString().padStart(4, '0');
      
      // Combine components to form the ID
      let requestId = `${prefix}_${timestamp}_${randomPart}_${countPart}`;
      
      // Extremely unlikely, but check if this ID has been generated before
      while (this.usedIds.has(requestId)) {
        const newRandomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const newCountPart = (this.counter++).toString().padStart(4, '0');
        requestId = `${prefix}_${timestamp}_${newRandomPart}_${newCountPart}`;
      }
      
      // Add to tracking set
      this.usedIds.add(requestId);
      
      // Optional cleanup to prevent memory leaks
      // Only keep the most recent 1000 IDs to avoid Set growing too large
      if (this.usedIds.size > 1000) {
        const idsArray = Array.from(this.usedIds);
        this.usedIds = new Set(idsArray.slice(idsArray.length - 1000));
      }
      
      return requestId;
    },
  
    /**
     * Generates a unique request ID specifically for contract requests
     * 
     * @returns {string} - A unique contract request ID
     */
    generateContractId() {
      // Generate a unique numeric ID
      const timestamp = Date.now(); // Current timestamp
      const randomPart = Math.floor(Math.random() * 10000); // Random 4-digit number
      const countPart = this.counter++; // Incremental counter

      // Combine components to form a numeric ID
      const requestId = parseInt(`${timestamp}${randomPart}${countPart}`, 10);

      return requestId;
    },
  
    /**
     * Generates a unique request ID for account-related requests
     * 
     * @returns {string} - A unique account request ID
     */
    generateAccountId() {
      return this.generate('222');
    },
  
    /**
     * Generates a unique request ID for price/tick requests
     * 
     * @returns {string} - A unique price request ID
     */
    generatePriceId() {
      return this.generate('333');
    },
  
    /**
     * Clear the tracking set - use with caution,
     * only when you're sure no responses are pending
     */
    reset() {
      this.usedIds.clear();
      this.counter = 0;
    }
  };
  
  export default RequestIdGenerator;
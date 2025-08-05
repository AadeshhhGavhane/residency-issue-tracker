const axios = require('axios');
const logger = require('../config/logger');

class GeocodingService {
  /**
   * Reverse geocode coordinates to address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<string>} Human readable address
   */
  static async reverseGeocode(lat, lng) {
    try {
      if (!lat || !lng) {
        return 'Unknown Location';
      }

      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
          'accept-language': 'en'
        },
        headers: {
          'User-Agent': 'ResidencyIssueTracker/1.0'
        },
        timeout: 5000
      });

      if (response.data && response.data.display_name) {
        return response.data.display_name;
      }

      return 'Unknown Location';
    } catch (error) {
      logger.error('Geocoding error:', error.message);
      return 'Unknown Location';
    }
  }

  /**
   * Geocode address to coordinates
   * @param {string} address - Address string
   * @returns {Promise<{lat: number, lng: number}>} Coordinates
   */
  static async geocode(address) {
    try {
      if (!address) {
        return null;
      }

      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          'accept-language': 'en'
        },
        headers: {
          'User-Agent': 'ResidencyIssueTracker/1.0'
        },
        timeout: 5000
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
      }

      return null;
    } catch (error) {
      logger.error('Geocoding error:', error.message);
      return null;
    }
  }

  /**
   * Get readable address from coordinates or existing address
   * @param {Object} location - Location object with coordinates or address
   * @returns {Promise<string>} Human readable address
   */
  static async getReadableAddress(location) {
    try {
      if (!location) {
        return 'Unknown Location';
      }

      // If we have coordinates, reverse geocode them
      if (location.lat && location.lng) {
        const address = await this.reverseGeocode(location.lat, location.lng);
        return address;
      }

      // If we have address components, construct readable address
      if (location.blockNumber || location.area) {
        let address = '';
        if (location.blockNumber) {
          address += `Block ${location.blockNumber}`;
        }
        if (location.area) {
          if (address) address += ', ';
          address += location.area;
        }
        return address || 'Unknown Location';
      }

      // If we have a full address string
      if (location.address) {
        return location.address;
      }

      return 'Unknown Location';
    } catch (error) {
      logger.error('Error getting readable address:', error);
      return 'Unknown Location';
    }
  }

  /**
   * Get location summary for display
   * @param {Object} location - Location object
   * @returns {Promise<string>} Location summary
   */
  static async getLocationSummary(location) {
    try {
      if (!location) {
        return 'Unknown Location';
      }

      // If we have coordinates, get full address
      if (location.lat && location.lng) {
        const fullAddress = await this.reverseGeocode(location.lat, location.lng);
        // Extract just the street and city part for summary
        const parts = fullAddress.split(', ');
        if (parts.length >= 2) {
          return `${parts[0]}, ${parts[1]}`;
        }
        return fullAddress;
      }

      // If we have address components, use them
      if (location.blockNumber || location.area) {
        let summary = '';
        if (location.blockNumber) {
          summary += `Block ${location.blockNumber}`;
        }
        if (location.area) {
          if (summary) summary += ', ';
          summary += location.area;
        }
        return summary || 'Unknown Location';
      }

      // If we have a full address string
      if (location.address) {
        const parts = location.address.split(', ');
        if (parts.length >= 2) {
          return `${parts[0]}, ${parts[1]}`;
        }
        return location.address;
      }

      return 'Unknown Location';
    } catch (error) {
      logger.error('Error getting location summary:', error);
      return 'Unknown Location';
    }
  }

  /**
   * Batch geocode multiple locations
   * @param {Array} locations - Array of location objects
   * @returns {Promise<Array>} Array of readable addresses
   */
  static async batchGeocode(locations) {
    try {
      const results = [];
      
      for (const location of locations) {
        const address = await this.getReadableAddress(location);
        results.push(address);
        
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return results;
    } catch (error) {
      logger.error('Batch geocoding error:', error);
      return locations.map(() => 'Unknown Location');
    }
  }
}

module.exports = GeocodingService; 
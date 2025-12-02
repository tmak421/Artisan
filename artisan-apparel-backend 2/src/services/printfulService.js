/**
 * Printful Service
 * ================
 * Integration with Printful API for print-on-demand fulfillment.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

class PrintfulService {
  constructor() {
    this.apiUrl = config.printful.apiUrl;
    this.apiKey = config.printful.apiKey;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 second timeout
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        const errorData = error.response?.data || {};
        logger.error('Printful API error', {
          status: error.response?.status,
          error: errorData.error || error.message,
          code: errorData.code,
        });
        throw error;
      }
    );
  }
  
  /**
   * Create an order in Printful
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    try {
      const { order, shipping, items, externalId } = orderData;
      
      const printfulOrder = {
        external_id: externalId,
        recipient: {
          name: shipping.name,
          address1: shipping.address1,
          address2: shipping.address2 || '',
          city: shipping.city,
          state_code: shipping.state || shipping.state_code,
          country_code: shipping.country || shipping.country_code || 'US',
          zip: shipping.zip || shipping.postal_code,
          phone: shipping.phone || '',
          email: order.customer_email,
        },
        items: items.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          retail_price: item.price?.toString(),
          files: item.files || [],
          options: item.options || [],
          name: item.name || undefined,
        })),
        retail_costs: {
          currency: 'USD',
          subtotal: order.total_usd?.toString(),
          discount: '0',
          shipping: '0',
          tax: '0',
        },
        gift: orderData.gift || null,
        packing_slip: orderData.packing_slip || null,
      };
      
      const response = await this.client.post('/orders', printfulOrder);
      const createdOrder = response.data.result;
      
      logger.logOrder('printful_order_created', {
        orderId: externalId,
        printfulId: createdOrder.id,
        status: createdOrder.status,
        itemCount: items.length,
      });
      
      return {
        id: createdOrder.id,
        externalId: createdOrder.external_id,
        status: createdOrder.status,
        shipping: createdOrder.shipping,
        shippingServiceName: createdOrder.shipping_service_name,
        created: new Date(createdOrder.created * 1000),
        costs: createdOrder.costs,
        retailCosts: createdOrder.retail_costs,
        dashboardUrl: createdOrder.dashboard_url,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.error('Failed to create Printful order', {
        externalId: orderData.externalId,
        error: errorMessage,
      });
      throw new Error(`Printful order creation failed: ${errorMessage}`);
    }
  }
  
  /**
   * Get order status from Printful
   * @param {number|string} printfulOrderId - Printful order ID or external ID
   * @returns {Promise<Object>} Order status
   */
  async getOrderStatus(printfulOrderId) {
    try {
      // Try as external ID first (prefixed with @)
      let url = `/orders/${printfulOrderId}`;
      if (typeof printfulOrderId === 'string' && !printfulOrderId.startsWith('@')) {
        url = `/orders/@${printfulOrderId}`;
      }
      
      const response = await this.client.get(url);
      const order = response.data.result;
      
      return {
        id: order.id,
        externalId: order.external_id,
        status: order.status,
        statusText: this.getStatusText(order.status),
        shipping: order.shipping,
        shipments: order.shipments?.map(s => ({
          carrier: s.carrier,
          service: s.service,
          trackingNumber: s.tracking_number,
          trackingUrl: s.tracking_url,
          shipDate: s.ship_date,
          deliveryDate: s.estimated_delivery,
          items: s.items,
        })) || [],
        created: new Date(order.created * 1000),
        updated: order.updated ? new Date(order.updated * 1000) : null,
        costs: order.costs,
      };
    } catch (error) {
      logger.error('Failed to get Printful order status', {
        printfulOrderId,
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Get human-readable status text
   * @param {string} status - Printful status code
   * @returns {string} Status text
   */
  getStatusText(status) {
    const statusMap = {
      'draft': 'Draft',
      'pending': 'Pending',
      'failed': 'Failed',
      'canceled': 'Cancelled',
      'inprocess': 'In Production',
      'onhold': 'On Hold',
      'partial': 'Partially Fulfilled',
      'fulfilled': 'Fulfilled',
    };
    return statusMap[status] || status;
  }
  
  /**
   * Cancel a Printful order
   * @param {number|string} printfulOrderId - Order ID
   * @returns {Promise<boolean>} Success status
   */
  async cancelOrder(printfulOrderId) {
    try {
      let url = `/orders/${printfulOrderId}`;
      if (typeof printfulOrderId === 'string' && !printfulOrderId.startsWith('@')) {
        url = `/orders/@${printfulOrderId}`;
      }
      
      await this.client.delete(url);
      
      logger.logOrder('printful_order_cancelled', { printfulOrderId });
      return true;
    } catch (error) {
      logger.error('Failed to cancel Printful order', {
        printfulOrderId,
        error: error.message,
      });
      return false;
    }
  }
  
  /**
   * Estimate shipping costs
   * @param {Object} shipping - Shipping address
   * @param {Array} items - Order items
   * @returns {Promise<Array>} Shipping options with costs
   */
  async estimateShipping(shipping, items) {
    try {
      const response = await this.client.post('/shipping/rates', {
        recipient: {
          address1: shipping.address1,
          city: shipping.city,
          country_code: shipping.country || 'US',
          state_code: shipping.state,
          zip: shipping.zip,
        },
        items: items.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
      });
      
      return response.data.result.map(rate => ({
        id: rate.id,
        name: rate.name,
        rate: parseFloat(rate.rate),
        currency: rate.currency,
        minDeliveryDays: rate.minDeliveryDays,
        maxDeliveryDays: rate.maxDeliveryDays,
      }));
    } catch (error) {
      logger.error('Failed to estimate shipping', { error: error.message });
      return [];
    }
  }
  
  /**
   * Get product variants
   * @param {number} productId - Printful product ID
   * @returns {Promise<Object>} Product with variants
   */
  async getProduct(productId) {
    try {
      const response = await this.client.get(`/products/${productId}`);
      const product = response.data.result;
      
      return {
        id: product.product.id,
        name: product.product.title,
        type: product.product.type,
        brand: product.product.brand,
        model: product.product.model,
        image: product.product.image,
        variants: product.variants.map(v => ({
          id: v.id,
          name: v.name,
          size: v.size,
          color: v.color,
          colorCode: v.color_code,
          price: v.price,
          inStock: v.in_stock,
        })),
      };
    } catch (error) {
      logger.error('Failed to get Printful product', {
        productId,
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Get sync products (your connected products)
   * @returns {Promise<Array>} Synced products
   */
  async getSyncProducts() {
    try {
      const response = await this.client.get('/sync/products');
      
      return response.data.result.map(product => ({
        id: product.id,
        externalId: product.external_id,
        name: product.name,
        variants: product.variants,
        synced: product.synced,
        thumbnail: product.thumbnail_url,
      }));
    } catch (error) {
      logger.error('Failed to get sync products', { error: error.message });
      return [];
    }
  }
  
  /**
   * Get sync product variants
   * @param {number} syncProductId - Sync product ID
   * @returns {Promise<Object>} Product with variants
   */
  async getSyncProductVariants(syncProductId) {
    try {
      const response = await this.client.get(`/sync/products/${syncProductId}`);
      const data = response.data.result;
      
      return {
        syncProduct: {
          id: data.sync_product.id,
          externalId: data.sync_product.external_id,
          name: data.sync_product.name,
          thumbnail: data.sync_product.thumbnail_url,
        },
        variants: data.sync_variants.map(v => ({
          id: v.id,
          externalId: v.external_id,
          syncProductId: v.sync_product_id,
          name: v.name,
          synced: v.synced,
          variantId: v.variant_id,
          retailPrice: v.retail_price,
          currency: v.currency,
          files: v.files,
          options: v.options,
        })),
      };
    } catch (error) {
      logger.error('Failed to get sync product variants', {
        syncProductId,
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Confirm a draft order for fulfillment
   * @param {number|string} orderId - Order ID
   * @returns {Promise<Object>} Confirmed order
   */
  async confirmOrder(orderId) {
    try {
      let url = `/orders/${orderId}/confirm`;
      if (typeof orderId === 'string' && !orderId.startsWith('@')) {
        url = `/orders/@${orderId}/confirm`;
      }
      
      const response = await this.client.post(url);
      
      logger.logOrder('printful_order_confirmed', { orderId });
      return response.data.result;
    } catch (error) {
      logger.error('Failed to confirm Printful order', {
        orderId,
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Process webhook event from Printful
   * @param {Object} event - Webhook event
   * @returns {Object} Processed event data
   */
  processWebhookEvent(event) {
    const { type, data } = event;
    
    logger.logWebhook('printful', type, {
      orderId: data.order?.external_id,
      printfulId: data.order?.id,
      status: data.order?.status,
    });
    
    // Map event types to internal format
    const eventMap = {
      'package_shipped': 'shipped',
      'order_created': 'created',
      'order_updated': 'updated',
      'order_failed': 'failed',
      'order_canceled': 'cancelled',
      'order_put_hold': 'on_hold',
      'order_remove_hold': 'processing',
    };
    
    return {
      type: eventMap[type] || type,
      orderId: data.order?.external_id,
      printfulId: data.order?.id,
      status: data.order?.status,
      shipment: data.shipment ? {
        carrier: data.shipment.carrier,
        trackingNumber: data.shipment.tracking_number,
        trackingUrl: data.shipment.tracking_url,
        shipDate: data.shipment.ship_date,
      } : null,
      raw: data,
    };
  }
}

// Export singleton instance
module.exports = new PrintfulService();

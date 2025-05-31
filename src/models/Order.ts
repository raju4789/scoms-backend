import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Order {
  /**
   * Unique identifier for the order (UUID).
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Number of devices ordered.
   */
  @Column('int')
  quantity: number;

  /**
   * Latitude of the shipping destination.
   */
  @Column('float')
  shipping_latitude: number;

  /**
   * Longitude of the shipping destination.
   */
  @Column('float')
  shipping_longitude: number;

  /**
   * Final total price for the order (after discount, before shipping).
   */
  @Column('float')
  total_price: number;

  /**
   * Discount applied to the order (absolute value, not percentage).
   */
  @Column('float')
  discount: number;

  /**
   * Shipping cost for the order.
   */
  @Column('float')
  shipping_cost: number;

  /**
   * Array describing how the order is split and fulfilled from different warehouses.
   * Example: [ { warehouse: "Los Angeles", quantity: 10 }, { warehouse: "Paris", quantity: 15 } ]
   */
  @Column('jsonb')
  warehouse_allocation: WarehouseAllocation[];

  /**
   * Timestamp when the order was created.
   */
  @CreateDateColumn()
  created_at: Date;
}

/**
 * Describes allocation of order quantities to each warehouse.
 * Example: [{ warehouse: "Los Angeles", quantity: 10 }]
 */
export interface WarehouseAllocation {
  warehouse: string;
  quantity: number;
}

export {};

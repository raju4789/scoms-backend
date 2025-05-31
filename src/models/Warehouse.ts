import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Warehouse {
  /**
   * Unique identifier for the warehouse.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Name of the warehouse (must be unique).
   */
  @Column({ unique: true })
  name: string;

  /**
   * Latitude coordinate of the warehouse location.
   */
  @Column('float')
  latitude: number;

  /**
   * Longitude coordinate of the warehouse location.
   */
  @Column('float')
  longitude: number;

  /**
   * Number of devices in stock at this warehouse.
   */
  @Column('int')
  stock: number;
}

export {};

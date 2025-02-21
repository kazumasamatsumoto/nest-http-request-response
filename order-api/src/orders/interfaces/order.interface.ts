export interface Order {
  id: number;
  products: number[];
  quantity: number;
  shipping_address: string;
  total_amount: number;
  created_at: Date;
}

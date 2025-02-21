import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateOrderDTO } from './dto/create-order.dto';
import { Order } from './interfaces/order.interface';

@Injectable()
export class OrdersService {
  // メモリ内のオーダー保存用配列
  private orders: Order[] = [];
  private currentId = 0;

  /* eslint-disable-next-line @typescript-eslint/require-await */
  async createOrder(createOrderDto: CreateOrderDTO): Promise<Order> {
    try {
      const order: Order = {
        id: ++this.currentId,
        products: createOrderDto.products,
        quantity: createOrderDto.quantity,
        shipping_address: createOrderDto.shipping_address,
        total_amount: createOrderDto.quantity * 1000,
        created_at: new Date(),
      };

      this.orders.push(order);
      return order;
    } catch (err) {
      console.error('注文の作成に失敗しました', err);
      throw new BadRequestException('注文の作成に失敗しました');
    }
  }
}

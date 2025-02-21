import { Controller, Post, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDTO } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDTO) {
    const order = await this.ordersService.createOrder(createOrderDto);
    return {
      order_id: order.id,
      total_amount: order.total_amount,
      message: '注文が完了しました',
    };
  }
}

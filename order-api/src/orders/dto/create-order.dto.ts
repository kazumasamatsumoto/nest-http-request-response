import {
  IsArray,
  IsNumber,
  IsString,
  Min,
  ArrayMinSize,
} from 'class-validator';

export class CreateOrderDTO {
  @IsArray()
  @ArrayMinSize(1, { message: '商品を1つ以上選択してください' })
  products: number[];

  @IsNumber()
  @Min(1, { message: '数量は1以上で指定してください' })
  quantity: number;

  @IsString()
  shipping_address: string;
}

# 商品注文API実装チュートリアル（ローカル完結版）

## 目的

- REST APIのPOSTエンドポイントの作成方法を学ぶ
- DTOを使ったリクエストの型安全な処理方法を理解する
- class-validatorを使った入力値検証の実装方法を習得する

## Step 1: プロジェクトのセットアップ

```bash
# プロジェクト作成
nest new order-api
cd order-api

# 必要なパッケージのインストール（DB関連は除外）
npm install class-validator class-transformer

# ordersモジュールの作成
nest generate module orders

# コントローラーの作成
nest generate controller orders

# サービスの作成
nest generate service orders

# DTOフォルダの作成
mkdir src/orders/dto
touch src/orders/dto/create-order.dto.ts

# interfaceの作成
mkdir src/orders/interfaces
touch src/orders/interfaces/order.interface.ts

```

フォルダ構造：

```
src/
├── app.module.ts
└── orders/
    ├── dto/
    │   └── create-order.dto.ts
    ├── orders.controller.ts
    ├── orders.module.ts
    └── orders.service.ts

```

## Step 2: ファイルの実装

1. まず`create-order.dto.ts`を実装：

```tsx
// src/orders/dto/create-order.dto.ts
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
```

このコードはTypeScriptで書かれたData Transfer Object (DTO)のクラス定義で、注文（Order）を作成する際のバリデーション（入力値の検証）を定義しています。

具体的に各部分を説明すると：

1. `class-validator`というライブラリからデコレータをインポートしています。これらのデコレータは入力値の検証ルールを定義するために使用されます。
2. `CreateOrderDTO`クラスには3つのプロパティがあります：
   - `products`: 商品IDの配列
     - `@IsArray()`: 配列であることを確認
     - `@ArrayMinSize(1)`: 配列の要素が最低1つ以上あることを確認
     - エラーメッセージ：「商品を1つ以上選択してください」
   - `quantity`: 数量
     - `@IsNumber()`: 数値であることを確認
     - `@Min(1)`: 1以上の値であることを確認
     - エラーメッセージ：「数量は1以上で指定してください」
   - `shipping_address`: 配送先住所
     - `@IsString()`: 文字列であることを確認

このDTOは、例えばAPIエンドポイントで注文を作成する際に、クライアントから送られてきたデータが正しい形式であることを確認するために使用されます。バリデーションに失敗した場合は、定義されたエラーメッセージが返されます。

1. レスポンス用の型を定義：

```tsx
// src/orders/interfaces/order.interface.ts
export interface Order {
  id: number;
  products: number[];
  quantity: number;
  shipping_address: string;
  total_amount: number;
  created_at: Date;
}
```

DTOとInterfaceには以下のような重要な違いがあります：

1. **主な用途の違い**:
   - DTO (Data Transfer Object):
     - データの転送や入力値の検証に特化したクラス
     - バリデーションのルールを定義できる（@IsArrayなどのデコレータを使用）
     - 主にAPIのリクエストボディの形式を定義する際に使用
   - Interface:
     - オブジェクトの型や構造を定義するための型定義
     - プロパティの型のみを定義
     - 実装の詳細は含まない
2. **コード例での違い**:

   ```tsx
   // DTO: バリデーションルールを含む
   export class CreateOrderDTO {
     @IsArray()
     products: number[]; // バリデーションあり
     // ...
   }

   // Interface: 型定義のみ
   export interface Order {
     id: number; // 単なる型定義
     products: number[];
     // ...
   }
   ```

3. **含まれる情報の違い**:
   - DTOの例では注文を作成する時に必要な情報のみ（products, quantity, shipping_address）
   - Interfaceの例では完全な注文情報（id, total_amount, created_atなども含む）
4. **実行時の動作**:
   - DTOはランタイムでバリデーションを実行できる（実際のチェック処理が走る）
   - Interfaceはコンパイル時のみ有効で、実行時には消える（型チェックのみ）

簡単に言えば、DTOは「データの受け渡しとチェック」のため、Interfaceは「型の定義」のために使用されます。

1. コントローラーを実装：

```tsx
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
```

1. サービスを実装（メモリ保存版）：

```tsx
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
```

1. バリデーションを有効化するために`main.ts`を更新：

```tsx
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

## Step 3: 動作確認

1. アプリケーションを起動：

```bash
npm run start:dev

```

1. APIをテスト：

```bash
curl -X POST <http://localhost:3000/orders> \\
-H "Content-Type: application/json" \\
-d '{
  "products": [1, 2, 3],
  "quantity": 2,
  "shipping_address": "東京都渋谷区..."
}'

```

powershell

```powershell
PS C:\Users\kazum\tutorial\nest\http-request-response> Invoke-RestMethod -Method Post -Uri "http://localhost:3000/orders" -ContentType "application/json" -Body '{"products": [1, 2, 3], "quantity": 2, "shipping_address": "東京都渋谷区..."}'

order_id total_amount message
-------- ------------ -------
       2         2000 注文が完了しました

PS C:\Users\kazum\tutorial\nest\http-request-response> try {
>>     Invoke-WebRequest -Method Post -Uri "http://localhost:3000/orders" -ContentType "application/json" -Body '{"products": [], "quantity": 2, "shipping_address": "東京都渋谷区..."}'
>> } catch {
>>     $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
>>     Write-Host "エラー: $($errorResponse.message)"
>> }
エラー: 商品を1つ以上選択してください

PS C:\Users\kazum\tutorial\nest\http-request-response> try {
>>     Invoke-WebRequest -Method Post -Uri "http://localhost:3000/orders" -ContentType "application/json" -Body '{"products": [1, 2, 3], "quantity": 0, "shipping_address": "東京都渋谷区..."}'
>> } catch {
>>     $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
>>     Write-Host "エラー: $($errorResponse.message)"
>> }
エラー: 数量は1以上で指定してください

PS C:\Users\kazum\tutorial\nest\http-request-response> try {
>>     Invoke-WebRequest -Method Post -Uri "http://localhost:3000/orders" -ContentType "application/json" -Body '{"products": "invalid", "quantity": 2, "shipping_address": "東京都渋谷区..."}'
>> } catch {
>>     $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
>>     Write-Host "エラー: $($errorResponse.message)"
>> }
エラー: 商品を1つ以上選択してください products must be an array

PS C:\Users\kazum\tutorial\nest\http-request-response>
```

期待されるレスポンス：

```json
{
  "order_id": 1,
  "total_amount": 2000,
  "message": "注文が完了しました"
}
```

## チェックポイント

- [ ] `npm run start:dev`でアプリケーションが正常に起動するか
- [ ] POSTリクエストで200レスポンスが返ってくるか
- [ ] バリデーションエラー時に400エラーが返ってくるか
- [ ] 注文IDが順番に採番されているか

## トラブルシューティング

### よくあるエラー1: バリデーションエラー

```
{
  "statusCode": 400,
  "message": ["数量は1以上で指定してください"]
}

```

解決策：

- リクエストボディの形式を確認
- 必須フィールドが含まれているか確認

### よくあるエラー2: 起動エラー

```
Error: Cannot start server

```

解決策：

- ポート3000が他のプロセスで使用されていないか確認
- `npm run start:dev`を再実行

## 発展課題

1. メモリ内に商品マスターデータを作成し、存在する商品IDのみ注文できるように改修
2. 注文履歴取得APIの実装
3. 注文キャンセルAPIの実装

このバージョンでは外部DBを使用せず、すべてメモリ上で完結するため、より簡単に始められます。アプリケーションを再起動すると保存データはリセットされます。

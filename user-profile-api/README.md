## 目的

- 基本的なRESTful APIの作り方を学ぶ
- DTOを使ってデータの形を定義する方法を理解する
- エラー処理の基本を身につける
- レスポンスヘッダーの設定方法を学ぶ

## Step 1: プロジェクトのセットアップ

1. NestJS CLIのインストール:

```bash
npm install -g @nestjs/cli

```

1. プロジェクトの作成:

```bash
nest new user-profile-api
# パッケージマネージャーの選択画面でnpmを選択

```

1. プロジェクトフォルダに移動:

```bash
cd user-profile-api

```

1. Usersモジュールの作成:

```bash
nest generate module users
nest generate controller users
nest generate service users

```

1. DTOフォルダの作成:

```bash
mkdir src/users/dto

```

dtoファイルの作成

```powershell
New-Item -ItemType File -Path "src/users/dto/user-profile.dto.ts" -Force
```

## Step 2: ファイルの実装

### 1. DTO (src/users/dto/user-profile.dto.ts)

```tsx
export class UserProfileDto {
  id!: number;
  name!: string;
  email!: string;
  age!: number;
  preferences!: string[];
}
```

### 2. コントローラー (src/users/users.controller.ts)

```tsx
// users.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Header,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserProfileDto } from './dto/user-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id/profile')
  @Header('Cache-Control', 'max-age=60')
  getProfile(
    @Param('id', ParseIntPipe) id: number,
    @Query('fields') fields?: string,
  ): Partial<UserProfileDto> {
    // keyof UserProfileDto として安全な型変換を行う
    const fieldArray = fields
      ? (fields.split(',') as (keyof UserProfileDto)[]).filter(
          (field): field is keyof UserProfileDto => {
            const validFields = new Set([
              'id',
              'name',
              'email',
              'age',
              'preferences',
            ]);
            return validFields.has(field);
          },
        )
      : [];

    return this.usersService.findOne(id, fieldArray);
  }
}
```

このコードの機能を詳しく解説します：

1. **エンドポイントの定義**

```tsx
@Controller('users')
@Get(':id/profile')

```

- `/users/{id}/profile` というURLパスのGETリクエストを処理します
- ユーザープロフィールを取得するためのRESTful APIエンドポイントを提供します

1. **キャッシュ制御**

```tsx
@Header('Cache-Control', 'max-age=60')

```

- レスポンスに60秒のキャッシュ期限を設定します
- サーバーの負荷軽減とレスポンス速度の向上に役立ちます

1. **パラメータの受け取り**

```tsx
@Param('id', ParseIntPipe) id: number,
@Query('fields') fields?: string,

```

- `id`: URLパスからユーザーIDを取得し、数値に変換します
- `fields`: クエリパラメータからフィールド指定を任意で受け取ります
  - 例: `/users/1/profile?fields=name,email`

1. **フィールドの安全な処理**

```tsx
const fieldArray = fields
  ? (fields.split(',') as (keyof UserProfileDto)[]).filter(
      (field): field is keyof UserProfileDto => {
        const validFields = new Set([
          'id',
          'name',
          'email',
          'age',
          'preferences',
        ]);
        return validFields.has(field);
      },
    )
  : [];
```

この部分が特に重要で、以下の理由で必要です：

a. **型安全性の確保**

- `as (keyof UserProfileDto)[]`: 文字列配列をUserProfileDtoのキーの配列として型付け
- TypeScriptの型システムと連携して、コンパイル時のエラーチェックを可能にします

b. **入力値の検証**

- `validFields`: 有効なフィールド名のセットを定義
- 不正なフィールド名を除外し、セキュリティを向上させます

c. **カスタマイズ可能なレスポンス**

- クライアントが必要なフィールドのみを指定可能
- 不要なデータの転送を防ぎ、パフォーマンスを最適化します

1. **サービスの呼び出し**

```tsx
return this.usersService.findOne(id, fieldArray);
```

- 検証済みのパラメータでサービスメソッドを呼び出します
- 部分的なユーザープロフィール（`Partial<UserProfileDto>`）を返します

このような実装が必要な理由：

1. **セキュリティ**

- 入力値の検証
- 不正なフィールドアクセスの防止

1. **パフォーマンス**

- 必要なデータのみを返す
- キャッシュによる最適化

1. **柔軟性**

- クライアントのニーズに応じたレスポンス
- RESTful APIのベストプラクティスに準拠

1. **保守性**

- 型安全性による堅牢なコード
- エラーの早期発見

この実装により、安全で効率的、かつ柔軟なAPIエンドポイントを提供することができます。

### 3. サービス (src/users/users.service.ts)

```tsx
// users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  private readonly users: UserProfileDto[] = [
    {
      id: 1,
      name: '田中太郎',
      email: 'tanaka@example.com',
      age: 30,
      preferences: ['読書', '映画'],
    },
  ];

  findOne(
    id: number,
    fields: (keyof UserProfileDto)[],
  ): Partial<UserProfileDto> {
    const user = this.users.find((user) => user.id === id);

    if (!user) {
      throw new NotFoundException(`ID: ${id}のユーザーが見つかりません`);
    }

    if (fields.length > 0) {
      return Object.fromEntries(
        fields
          .filter((field) => field in user)
          .map((field) => [field, user[field]]),
      ) as Partial<UserProfileDto>;
    }

    return user;
  }
}
```

## Step 3: 動作確認

1. サーバーの起動:

```bash
npm run start:dev

```

1. APIのテスト:

```bash
# 全てのフィールドを取得
curl <http://localhost:3000/users/1/profile>

# 名前とメールアドレスのみ取得
curl <http://localhost:3000/users/1/profile?fields=name,email>

# 存在しないユーザーを取得（エラー確認）
curl <http://localhost:3000/users/999/profile>

```

powershell

```powershell
PS C:\Users\kazum\tutorial\nest\http-request-response> Invoke-RestMethod -Uri 'http://localhost:3000/users/1/profile' -Method Get

id          : 1
name        : 田中太郎
email       : tanaka@example.com
age         : 30
preferences : {読書, 映画}

PS C:\Users\kazum\tutorial\nest\http-request-response> Invoke-RestMethod -Uri 'http://localhost:3000/users/1/profile?fields=name,email' -Method Get

name     email
----     -----
田中太郎 tanaka@example.com

PS C:\Users\kazum\tutorial\nest\http-request-response> try {
>>  Invoke-RestMethod -Uri 'http://localhost:3000/users/999/profile' -Method Get
>> } catch {
>>   $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
>>   Write-Host "エラー: $($errorResponse.message)"
>> }
エラー: ID: 999のユーザーが見つかりません
PS C:\Users\kazum\tutorial\nest\http-request-response>
```

## チェックポイント

- [ ] `npm run start:dev`でサーバーが起動する
- [ ] `curl`で正しくデータが取得できる
- [ ] フィールドの絞り込みができる
- [ ] 存在しないIDにアクセスすると404エラーが返る
- [ ] レスポンスヘッダーに`Cache-Control`が設定されている

## よくあるエラーと解決方法

1. **サーバーが起動しない**

```
Error: Cannot find module '@nestjs/core'

```

解決方法:

```bash
npm install

```

1. **コンパイルエラー**

```
Property 'xxx' does not exist on type 'UserProfileDto'

```

解決方法:

- DTOに必要なプロパティが定義されているか確認
- タイプミスがないか確認

1. **404エラーが出ない**

```
Cannot read property 'find' of undefined

```

解決方法:

- サービスクラスの`users`配列が正しく定義されているか確認
- コンストラクタで`users`を初期化しているか確認

## 次のステップ

1. バリデーションを追加する（@nestjs/class-validator）
2. Swaggerドキュメントを追加する
3. データベース（TypeORM）と連携する

この実装を通じて:

- NestJSの基本的なプロジェクト構造
- コントローラーとサービスの役割分担
- DTOの使い方
- 基本的なエラーハンドリング
- パラメータの取得方法

を学ぶことができます。

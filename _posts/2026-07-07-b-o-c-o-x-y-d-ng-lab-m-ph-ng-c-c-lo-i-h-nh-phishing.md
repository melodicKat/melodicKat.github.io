---
title: "Báo cáo xây dựng lab mô phỏng các loại hình phishing"
date: 2026-07-07 13:09:34 +0700
categories: [personal-project, home-lab]
tags: [learning, lab, phishing]
---

# **_Thiết kế mô phỏng_**

Mục tiêu là hệ thống hóa và tái hiện các kỹ thuật tấn công phishing dựa trên web, cụ thể là homograph attack, tabnabbing, reverse proxy phishing, browser in the browser và clickjacking. 
## **_Môi trường thực nghiệm_**

Để tiến hành các kịch bản tấn công mà không vi phạm các nguyên tắc đạo đức nghề nghiệp, cũng như đảm bảo cách ly hoàn toàn mã độc khỏi mạng công cộng, thực hiện xây dựng lab mô phỏng trên các phần mềm ảo hóa
### **_Hạ tầng ảo hóa_**

Sử dụng phần mềm ảo hóa VMware Workstation và VirtualBox để cấp phát tài nguyên và thiết lập các máy ảo. Toàn bộ luồng mạng giữa các máy ảo được cấu hình theo mô hình mạng host only, NAT. Mục đích nhằm tạo ra một Sandbox an toàn, ngăn chặn tuyệt đối việc rò rỉ các gói tin độc hại hoặc các trang web giả mạo ra môi trường mạng thực tế của tổ chức hay cá nhân.

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps1.png) 
_Hình 1: Hạ tầng ảo hóa cho kịch bản tấn công homograph_

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps2.png) 
_Hình 2: Hạ tầng ảo hóa cho kịch bản tấn công tabnabbing_

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps3.jpg)
_Hình 3: Hạ tầng ảo hóa cho reverse proxy phishing_

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps4.jpg) 
_Hình 4: Hạ tầng demo cho browser in the browser_

### **_Các thành phần hệ thống (Kịch bản Homograph)_**

Hệ thống Lab được chia thành 3 node chính, đại diện cho 3 chủ thể trong một cuộc tấn công phishing:

+ Máy tấn công: Đóng vai trò là trung tâm nơi phát tán và thu thập dữ liệu từ những cuộc tấn công phishing. Máy ảo này sử dụng hệ điều hành Kali Linux – một nền tảng chuyên dụng cho kiểm thử bảo mật. Tại đây các công cụ tấn công được cài đặt và vận hành, bao gồm: Social-Engineering Toolkit dùng để nhân bản website, GOPHISH để quản lý chiến dịch phát tán lừa đảo, cùng với máy chủ Apache Web Server và các đoạn mã script phục vụ việc điều hướng mục tiêu.

+ Máy nạn nhân: Đóng vai trò là người dùng cuối. Nút này được triển khai trên hai nền tảng hệ điều hành phổ biến là Windows 10/11 và Ubuntu Desktop. Mục đích của việc đa dạng hóa hệ điều hành là để kiểm tra tính tương thích và mức độ thành công của các kỹ thuật tấn công trên nhiều trình duyệt web khác nhau như google chrome, mozilla firefox, microsoft edge, từ đó đánh giá khả năng phòng vệ mặc định của từng trình duyệt.

+ Local DNS: Giả lập việc attacker trong môi trường thật có thể đăng kí một tên miền lừa đảo gần giống với những tên miền uy tín nhằm làm tăng tỉ lệ thành công của một cuộc tấn công phishing. Tăng tính thực tế của các kịch bản tấn công được xây dựng.

### **_Các thành phần hệ thống cho kịch bản Tabnabbing_**

Hệ thống Lab cho kịch bản Tabnabbing được cấu trúc thành 3 node chính, mô phỏng quy trình điều hướng và chiếm hữu tab trình duyệt:

+ Máy chủ mồi nhử: Đóng vai trò là trạm trung gian để thực hiện hành vi đánh tráo tab trình duyệt. Máy ảo này chạy hệ điều hành Kali Linux và vận hành dịch vụ Apache Web Server. Tại đây lưu trữ hai thành phần cốt lõi:

+ Trang kích hoạt - trigger.html: Giả lập giao diện hòm thư Outlook nội bộ uy tín để thu hút nạn nhân click vào liên kết.

+ Trang mồi - tuoitre_bait.html: Một trang tin tức giả mạo (ví dụ: Báo Tuổi Trẻ) chứa đoạn mã JavaScript độc hại sử dụng đối tượng window.opener kết hợp với hàm setTimeout. Sau một khoảng thời gian định sẵn, trang này sẽ âm thầm điều hướng tab mẹ sang máy chủ thu thập dữ liệu.

+ Máy chủ thu thập dữ liệu - Gophish Phishing Server: Đóng vai trò là đích đến cuối cùng của cuộc tấn công, máy ảo này cũng sử dụng Kali Linux để vận hành nền tảng Gophish. Nhiệm vụ chính bao gồm: Landing Page là host trang đăng nhập giả mạo (ví dụ: Gmail Login) được thiết kế tỉ mỉ để lừa nạn nhân nhập thông tin xác thực, capture Data sẽ lắng nghe và ghi lại toàn bộ tài khoản, mật khẩu mà nạn nhân đã submit qua biểu mẫu giả mạo.

**+** Máy nạn nhân (Victim Node): Đóng vai trò là đối tượng bị tấn công, sử dụng hệ điều hành Windows 10. Node này là nơi diễn ra toàn bộ hành vi của người dùng từ việc đọc hòm thư giả lập, click vào liên kết tin tức cho đến khi bị lừa nhập thông tin trên trang đăng nhập đã bị đánh tráo âm thầm ở tab cũ. Việc thử nghiệm trên máy này giúp đánh giá khả năng của các trình duyệt hiện đại trong việc chặn đối tượng window.opener thông qua thuộc tính rel="noopener".

### _Các thành phần hệ thống cho kịch bản reverse proxy phishing_

Hệ thống lab cho kịch bản này có 3 thành phần chính: web server, client và reverse proxy.

+ Web server: chức năng triển khai giao diện thật của juice shop. Đóng vai trò là 1 website thật để truy cập.

+ DNS server: đóng vai trò phân giải tên miền trong local, cho phép mô phỏng chức năng đăng ký tên miền cho web server và reverse proxy.

+ Nginx server: nhằm mô phỏng thực tế triển khai server, nginx server thiết lập với cổng 443 kết nối với webserver nhằm thiết lập kết nối an toàn với key và chứng chỉ được tạo.

+ Client: “Chuột bạch” để thử nghiệm

+ Reverse proxy server: đứng giữa người dùng và webserver thật, chạy server giả mạo để lấy thông tin qua lại giữa user và web server thật.

### _Các thành phần hệ thống cho kịch bản browser in the browser_

Hệ thống lab cho kịch bản này có 2 thành phần chính: phishing web server và client.

+ Phishing web server - Attacker server: chức năng lưu trữ và triển khai trang web độc hại chứa mã HTML/CSS/JS tạo ra cửa sổ trình duyệt giả mạo. Đồng thời chạy dịch vụ backend node.js đóng vai trò tiếp nhận và ghi log thông tin tài khoản username/password khi người dùng nhập vào form giả mạo.

+ Client: “Chuột bạch” để thử nghiệm, đóng vai trò là nạn nhân sử dụng trình duyệt thật để truy cập vào đường link lừa đảo và tương tác với giao diện browser in the browser.
## **_Xây dựng kịch bản và kết quả mô phỏng kỹ thuật_**

Dựa trên hạ tầng đã thiết lập, nghiên cứu tiến hành thiết kế và vận hành hai kịch bản tấn công điển hình, có khả năng thao túng nhận thức và đánh lừa thị giác của người dùng cao nhất hiện nay.

### **_Kịch bản 1: Tấn công giả mạo dựa trên sự tương đồng ký tự Latinh (Visual Similarity Homograph Attack)_**

Kịch bản này tập trung vào việc khai thác sự hạn chế trong khả năng phân biệt các ký tự có hình dáng gần như trùng khớp trong bảng mã Latinh tiêu chuẩn (ASCII). Phương pháp này nhắm trực tiếp vào sự chủ quan của người dùng khi quan sát thanh địa chỉ và các liên kết trong email, đồng thời vượt qua các cơ chế kiểm tra tên miền quốc tế của trình duyệt hiện đại.

1. **Nguyên lý kỹ thuật**

Kỹ thuật này dựa trên khái niệm "Visual Glyphs" – các ký tự khác nhau về mã định danh nhưng có cách hiển thị hình ảnh tương đương trên các phông chữ hệ thống phổ biến như Arial, Calibri hoặc Sans-serif.

Kẻ tấn công thực hiện thay đổi một hoặc nhiều ký tự trong tên miền gốc bằng các ký tự Latinh khác có hình dạng tương đồng. Vì tất cả các ký tự được sử dụng đều nằm trong bảng mã Latinh hợp lệ, trình duyệt sẽ hiển thị chuỗi ký tự nguyên bản trên thanh địa chỉ mà không đưa ra bất kỳ cảnh báo bảo mật đặc biệt nào.

2. **Quy trình thực hiện trong môi trường Lab**

Quá trình thực nghiệm được triển khai theo các bước kỹ thuật sau để mô phỏng một cuộc tấn công thực tế:

**Bước 1: Thiết lập bản ghi điều hướng trên DNS Server:**

- Tại máy chủ Windows Server (DNS), quản trị viên tạo một Forward Lookup Zone mới ứng với tên miền Latinh giả mạo đã chọn (ví dụ: onIine.acb.com.vn).

- Cấu hình bản ghi A (Address) để ánh xạ tên miền này trực tiếp về địa chỉ IP tĩnh của máy tấn công (Kali Linux).

**Bước 2: Chuẩn bị nội dung và hệ thống thu thập dữ liệu:**

- Sử dụng công cụ Social-Engineering Toolkit (SET) để sao chép (Clone) toàn bộ mã nguồn HTML, CSS và giao diện của trang đăng nhập ngân hàng mục tiêu.

- Tích hợp mã nguồn này vào mục Landing Page của Gophish, kích hoạt các module Capture Submitted Data để ghi lại thông tin định danh khi người dùng nhập vào form giả mạo.

**Bước 3: Phát tán và theo dõi chiến dịch qua Email:**

- Soạn thảo Email lừa đảo với nội dung mang tính khẩn cấp, chứa liên kết dẫn đến tên miền Latinh giả mạo đã thiết lập.

- Thông qua Gophish, gửi email tới máy nạn nhân (Victim) và quan sát tỷ lệ người dùng click vào liên kết do không nhận ra sự khác biệt về ký tự trên thanh địa chỉ trình duyệt.

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps5.jpg)
_Hình 5: Một tab là URL thật, một tab là URL chứa ký tự Homograph_

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps6.jpg) 
_Hình 6: Kết quả thu thập từ server_
### **_Kịch bản 2: Tấn công Tabnabbing_**

Khác với sự giả mạo trực tiếp của Homograph, Tabnabbing là một kỹ thuật tấn công gián tiếp. Kỹ thuật này không tấn công vào tab người dùng đang tương tác, mà âm thầm thao túng các tab đang được mở sẵn ở chế độ nền lợi dụng sự phân tâm khi người dùng thực hiện đa nhiệm.

**1. Cơ chế hoạt động:** Lỗ hổng này khai thác thuộc tính window.opener trong môi trường JavaScript. Khi người dùng click vào một liên kết trên "trang web A" (trang mồi) để mở ra "trang web B" trong một tab mới, "trang web B" vẫn có đặc quyền kiểm soát đối tượng window.opener (tức là tab A). Lợi dụng điều này, mã độc nhúng trên trang B có thể gửi lệnh window.opener.location = 'URL_Phishing' để thay đổi hoàn toàn nội dung của tab A ban đầu thành một trang đăng nhập giả mạo mà người dùng không hề hay biết.

**2. Triển khai kỹ thuật:**

**Bước 1:** Xây dựng html trigger dẫn đến trang mồi (Decoy Page). Xây dựng 1 trang web html đóng vai trò là mồi nhử dẫn dụ người dùng click vào link để dẫn đến trang mồi.

**Bước 2:** Xây dựng trang mồi. Xây dựng 1 trang mồi chứa nội dung hấp dẫn khiến người đọc phải quan tâm đến và đồng thời chèn 1 đoạn script thực thi chuyển hướng trang web trigger sang trang web đăng nhập giả mạo làm người dùng tưởng là đã hết phiên đăng nhập và vô tư nhập tài khoản mật khẩu để đăng nhập lại.

**Bước 3:** Thiết lập thời gian chờ (Timeout). Mã JavaScript thao túng sẽ không thực thi ngay lập tức. Nó được thiết lập hàm setTimeout() từ 30 đến 60 giây. Khoảng thời gian này là đủ dài để người dùng mất tập trung vào tab cũ và đinh ninh rằng tab đó vẫn an toàn như lúc đầu.

**Bước 4:** Sử dụng công cụ Gophish để phát tán trang web đăng nhập giả mạo và thu thập dữ liệu nạn nhân thông qua trang web này.

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps7.jpg) 
_Hình 7: Đoạn code tabnabling_
### **_Kịch bản 3: reverse proxy phishsing._**

**Triển khai kỹ thuật:**

**Bước 1:** Cài đặt juice shop trên máy host, đặt IP 127.0.0.1:3000
![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps8.jpg) 
_Hình 8: Khởi động server_

**Bước 2**: Sử dụng mkcert để gennerate cert với lệnh mkcert “*.juice.local” juice.local. Bước này nhằm mô phỏng quá trình tạo cert cho domain.

Bước 3: Cấu hình nginx và chỉ định vị trí đến cert và key đã tạo trên máy thật. Cả webserver và nginx hoạt động trên máy thật.
![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps9.jpg) 
_Hình 9: Cầu hình nginx_

Bước 4: Trên DNS server, tạo hai domain name: juice.local – 192.168.1.124 và julce.local – 192.168.165.5. Đây là 2 domain giả định cho webserver thật và giả mạo. Với tương ứng là IP máy chạy chúng.
![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps10.jpg) 
_Hình 10: Cấu hình DNS_

Bước 5: Trên máy tấn công, tạo cert mkcert “*.julce.local” julce.local dùng cho reverse proxy. Đem cả 2 file cert và key vừa tạo ra đó vào thư mục julce.local trong đường dẫn:
``` path
/home/<username>/.evilginx2/crt/sites/
```

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps11.jpg) 
_Hình 11: Tạo thư mục lưu trữ cert cho proxy server_

Bước 6: Đem rootCA sang cho máy client victim và import nhằm hoàn tất việc setup chứng chỉ.

Bước 7: Tạo phishlets cơ bản cho evilginx2 với juiceshop

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps12.jpg) 
_Hình 12: Tạo phishlets cho juice shop web_

Bước 8: config domain là julce.local, set ipv4 là ip máy attacker và tắt autocert.
![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps13.jpg) 
_Hình 13: Config evilginx2_

Bước 9: Tạo phishlets và url độc hại.

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps14.jpg) 
_Hình 14: Lấy url phishing_

Bước 10: Truy cập url trên máy victim, nhập mật khẩu để kiểm tra.

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps15.jpg) 

_Hình 15: Đăng nhập trên trang fake_

Bước 11: Ấn login và quay lại máy attacker để xem thông tin thu thập

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps16.jpg) 
_Hình 16: Lấy kết quả_

### **_Kịch bản 4: browser in the browser attack._**

**Triển khai kỹ thuật:**

Bước 1: clone giao diện của trang login juice shop.

Bước 2: Chỉnh sửa form login, thêm script để khi đăng nhập sẽ gửi dữ liệu đến server nhất định.

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps17.jpg) 
_Hình 17: Code chuyển dữ liệu về server_

Bước 3: Xây dựng trang web fake, chức năng popup browser và dẫn iframe vào trang juiceshop đã clone.

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps18.jpg) 
_Hình 18: Đăng nhập vô web fake_

Bước 4: Khởi động server, truy cập trang web và đăng nhập tài khoản cũng như mật khẩu để kiểm tra.

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps19.jpg) 
_Hình_ 19: Nhập mật khẩu và tài khoản

Bước 5: vào file login.txt trên server để kiểm tra

![](/assets/img/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing/b-o-c-o-x-y-d-ng-lab-m-ph-ng-c-c-lo-i-h-nh-phishing-wps20.jpg)
_Hình 20: Kiểm tra file log ghi nhận_
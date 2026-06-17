---
title: "Module 5: Web fuzzing"
date: 2026-06-17 11:32:44 +0700
categories: [hack-the-box, web-penetration-tester-path]
tags: [learning, red-team, htb, cwes]
---

# 2. TASK

## **SECTION 3: Directory and File Fuzzing**

directory fuzzing

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image.png)

files fuzzing

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-1.png)

### **Question 1**

---

**Within the "webfuzzing_hidden_path" path on the target system (ie http://IP:PORT/webfuzzing_hidden_path/), fuzz for folders and then files to find the flag: HTB{w3b_f1l3_fuzz1ng_fl4g}**

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-2.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-3.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-4.png)

## **SECTION 4: Recursive Fuzzing**

### **Question 1**

---

**Recursively fuzz the "recursive_fuzz" path on the target system (ie http://IP:PORT/recursive_fuzz/) to find the flag:** 

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-5.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-6.png)

## SECTION 5: **Parameter and Value Fuzzing**

## **Question 1**

---

wenum -w /usr/share/seclists/Discovery/Web-Content/common.txt --hc 404 -u "[http://154.57.164.70:30186/get.php?x=FUZZ](http://154.57.164.70:30186/get.php?x=FUZZ)"

What flag do you find when successfully fuzzing the GET parameter? HTB{g3t_fuzz1ng_succ3ss}

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-7.png)

## **Question 2**

---

 ffuf -u [http://154.57.164.70:30186/post.php](http://154.57.164.70:30186/post.php) -H 'Content-Type: application/x-www-form-urlencoded' -d 'y=FUZZ' -ic -w /usr/share/seclists/Discovery/Web-Content/common.txt -mc 200 -t 120

**What flag do you find when successfully fuzzing the POST parameter? HTB{p0st_fuzz1ng_succ3ss}**

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-8.png)

## **SECTION 6: Virtual Host and Subdomain Fuzzing**

### Question 1

Using GoBuster against the target system to fuzz for vhosts using the common.txt wordlist, which vhost starts with the prefix "web-"? Respond with the full vhost, eg web-123.inlanefreight.htb: web-beans.inlanefreight.htb

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-9.png)

### Question 2

**Using GoBuster against inlanefreight.com to fuzz for subdomains using the subdomains-top1million-5000.txt wordlist, which subdomain starts with the prefix "su"? Respond with the full vhost, eg web.inlanefreight.com:** [support.inlanefreight.com](http://support.inlanefreight.com/)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-10.png)

## **SECTION 7: Filtering Fuzzing Output**

### Question 1

**What flag do you find when successfully fuzzing the POST parameter? HTB{p0st_fuzz1ng_succ3ss}**

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-11.png)

## **SECTION 8: Validating Findings**

### **Question 1**

---

**Fuzz the target system using directory-list-2.3-medium.txt, looking for a hidden directory. Once you have found the hidden directory, responsibly determine the validity of the vulnerability by analyzing the tar.gz file in the directory. Answer using the full Content-Length header, eg "Content-Length: 1337": 210**

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-12.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-13.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-14.png)

## **SECTION 11: API Fuzzing**

### **Question 1**

**What is the value returned by the endpoint that the api fuzzer has identified? h1dd3n_r357**

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-15.png)

## **SECTION 12: Skills Assessment**

All fuzzing can be completed using the `common.txt` SecLists Wordlist, found at `/usr/share/seclists/Discovery/Web-Content` on Pwnbox, or via the SecLists GitHub.

## **Question 1**

---

**After completing all steps in the assessment, you will be presented with a page that contains a flag in the format of HTB{...}. What is that flag? HTB{w3b_fuzz1ng_sk1lls}**

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-16.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-17.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-18.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-19.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-20.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-21.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-22.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-23.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-24.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-25.png)

![image.png](/assets/img/module-5-web-fuzzing/module-5-web-fuzzing-image-26.png)
---
title: "Module19: Attacking Common Applications - Skills Assessment"
date: 2026-07-07 14:32:24 +0700
categories: [hack-the-box, web-penetration-tester-path]
tags: [learning, red-team, htb, cwes]
---

# Attacking Common Applications - Skills Assessment I
During a penetration test against the company Inlanefreight, you have performed extensive enumeration and found the network to be quite locked down and well-hardened. You come across one host of particular interest that may be your ticket to an initial foothold. Enumerate the target host for potentially vulnerable applications, obtain a foothold, and submit the contents of the flag.txt file to complete this portion of the skills assessment.
## Question 1
What vulnerable application is running?
![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-5b34822deb0fa1396185e7006aa2935f.png)
## Question 2
What port is this application running on?
![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-67e597d252168afb8d6510b3586136b1.png)
## Question 3
What version of the application is in use?
![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-48fa098850db584a47c83cbe8deab67d.png)
## Question 4
Exploit the application to obtain a shell and submit the contents of the flag.txt file on the Administrator desktop.
![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-fcd151396afb6747197f6cd521f8d3f5.png)

![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-a6d36119592f8df06d6d7a0916842bd5.png)

![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-7c35d21451e3525cc69a7d606dc19f73.png)

![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-10b988f62a714ed85e3f43d64bc13203.png)

![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-f069187d152b851d7f79c0ce7bf7b235.png)

![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-8aa575ab210ac46adf4ea9d51552e9d6.png)

# Attacking Common Applications - Skills Assessment II
---
During an external penetration test for the company Inlanefreight, you come across a host that, at first glance, does not seem extremely interesting. At this point in the assessment, you have exhausted all options and hit several dead ends. Looking back through your enumeration notes, something catches your eye about this particular host. You also see a note that you don't recall about the `gitlab.inlanefreight.local` vhost.

Performing deeper and iterative enumeration reveals several serious flaws. Enumerate the target carefully and answer all the questions below to complete the second part of the skills assessment.
## Question 1
What is the URL of the WordPress instance?

![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-c7ce18554e4914ba6b39bd193ca7cc86.png)

![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-0e4d83ab10d87615fd382c8ecdb7277f.png)
## Question 2
What is the name of the public GitLab project?
![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-4cc935f86aa4cdee59c4dea0b837db20.png)

![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-06b72105aad13fe00a6b83de6038ec14.png)
## Question 3
What is the FQDN of the third vhost?
![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-27aa14ab90a4650f229eb30a9ca75b09.png)
## Question 4
What application is running on this third vhost? (One word)
![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-9ca0f4ec9027f25c1c4a0b2470e52254.png)
## Question 5
What is the admin password to access this application?
![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-ef9d0fd01fbc016524de307ab7bcc79a.png)

![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-5c4dc89c1b9abb1232c9c6a0f84ff761.png)
## Question 6
Obtain reverse shell access on the target and submit the contents of the flag.txt file.
![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-39d8a25eebfc174db8eb5217303cac91.png)

![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-27ee2006fdd3fe7ffa117850c7ec6595.png)

![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-39061fcab2de090f59ab5e1caf963a72.png)
# Attacking Common Applications - Skills Assessment III
---
During our penetration test our team found a Windows host running on the network and the corresponding credentials for the Administrator. It is required that we connect to the host and find the `hardcoded password` for the MSSQL service.
## Question 1
What is the hardcoded password for the database connection in the MultimasterAPI.dll file?
RDP to 10.129.95.200 (ACADEMY-ACA-MULTIMASTER), with user "Administrator" and password "xcyj8izxNVzhf4z"
![](/assets/img/module19-attacking-common-applications-skills-assessment/module19-attacking-common-applications-skills-assessment-cd5019b5b734065840dd3b9ef966337e.png)
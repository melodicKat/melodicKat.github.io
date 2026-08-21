---
layout: page
title: About
permalink: /about/
icon: fas fa-user
order: 4
toc: false
---

<div class="about-page">
  <section class="about-hero">
    <div class="about-hero__content">
      <p class="about-kicker">Information Security Student</p>
      <h2>Hi, I'm Nguyễn Giáp Anh Khoa.</h2>
      <p class="about-lead">
        I explore offensive security through hands-on labs, CTF competitions,
        and projects that turn security concepts into practical experience.
      </p>

      <div class="about-meta">
        <span>HUIT · Class of 2027</span>
        <span>Bien Hoa, Vietnam</span>
      </div>

      <div class="about-actions">
        <a class="about-button about-button--primary" href="https://github.com/{{ site.github.username }}" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a class="about-button" href="mailto:{{ site.social.email }}">
          Contact me
        </a>
      </div>
    </div>
  </section>

  <section class="about-section">
    <div class="about-section__heading">
      <div><p>Focus</p><h2>What I am working toward</h2></div>
    </div>

    <p>
      My primary interest is <strong>Offensive Security</strong>, especially
      <strong>Web Application Penetration Testing</strong>. My goal is to become
      a professional penetration tester who can identify vulnerabilities and
      help organizations improve their security posture.
    </p>

    <div class="about-focus-grid">
      <article class="about-card">
        <h3>Web Security</h3>
        <p>Testing modern web applications, APIs, authentication flows, and access controls.</p>
      </article>
      <article class="about-card">
        <h3>Network Security</h3>
        <p>Enumeration, traffic analysis, service assessment, and attack-path discovery.</p>
      </article>
      <article class="about-card">
        <h3>Active Directory</h3>
        <p>Building foundational knowledge of Windows domains, privilege paths, and exploitation.</p>
      </article>
    </div>
  </section>

  <section class="about-section">
    <div class="about-section__heading">
      <div><p>Toolkit</p><h2>Technical skills</h2></div>
    </div>

    <div class="about-skill-grid">
      <div class="about-skill-group">
        <h3>Programming</h3>
        <div class="about-chips"><span>C/C++</span><span>C#</span><span>Python</span></div>
      </div>
      <div class="about-skill-group">
        <h3>Security tools</h3>
        <div class="about-chips">
          <span>Burp Suite</span><span>Nmap</span><span>Wireshark</span>
          <span>Metasploit</span><span>Gobuster</span><span>SQLmap</span>
          <span>FFUF</span><span>John the Ripper</span><span>Hashcat</span>
        </div>
      </div>
      <div class="about-skill-group">
        <h3>Operating systems</h3>
        <div class="about-chips"><span>Kali Linux</span><span>Ubuntu</span><span>Windows</span></div>
      </div>
      <div class="about-skill-group">
        <h3>Knowledge</h3>
        <div class="about-chips">
          <span>TCP/IP</span><span>Linux</span><span>OWASP Top 10</span>
          <span>Web Security</span><span>Active Directory</span>
        </div>
      </div>
    </div>
  </section>

  <section class="about-section">
    <div class="about-section__heading">
      <div><p>Hands-on</p><h2>Practical experience</h2></div>
    </div>

    <div class="about-experience">
      <p>
        I continuously improve through security labs and Capture The Flag competitions.
        I participated in <strong>BKISC CTF 2026</strong> and <strong>THCon CTF 2026</strong>,
        solving beginner Web and OSINT challenges.
      </p>
      <div class="about-chips about-chips--accent">
        <span>SQL Injection</span><span>XSS</span><span>Authentication</span>
        <span>Authorization</span><span>File Inclusion</span><span>File Upload</span>
        <span>Reconnaissance</span><span>Linux Privilege Escalation</span>
        <span>Active Directory</span>
      </div>
    </div>
  </section>

  <section class="about-section">
    <div class="about-section__heading">
      <div><p>Build</p><h2>Featured projects</h2></div>
    </div>

    <div class="about-project-grid">
      <article class="about-project-card">
        <div class="about-project-card__top"><span>01</span></div>
        <h3>Phishing Simulation Lab</h3>
        <p>
          A controlled lab using OWASP Juice Shop, Nginx, Evilginx2, and GoPhish
          to study Browser-in-the-Browser, clickjacking, homograph attacks, and proxy phishing.
        </p>
        <div class="about-project-card__tags"><span>GoPhish</span><span>Evilginx2</span><span>Nginx</span></div>
      </article>

      <article class="about-project-card">
        <div class="about-project-card__top"><span>02</span></div>
        <h3>DoS / DDoS Home Lab</h3>
        <p>
          A virtual environment with Kali Linux, Ubuntu, and Windows for simulating attacks,
          analyzing traffic in Wireshark, and evaluating firewall and IP-blocking mitigations.
        </p>
        <div class="about-project-card__tags"><span>Wireshark</span><span>Networking</span><span>Mitigation</span></div>
      </article>
    </div>
  </section>

  <section class="about-section about-learning-section">
    <div class="about-section__heading">
      <div><p>Now</p><h2>Current learning</h2></div>
    </div>

    <div class="about-learning-grid">
      <ul class="about-check-list">
        <li>Hack The Box Academy Penetration Tester Path</li>
        <li>Web Application Security</li>
        <li>Active Directory Exploitation</li>
        <li>Privilege Escalation</li>
        <li>Malware Analysis</li>
        <li>Technical Report Writing</li>
      </ul>

      <div class="about-platforms">
        <p>Learning platforms</p>
        <span>Hack The Box Academy</span><span>TryHackMe</span>
        <span>PortSwigger Academy</span><span>picoCTF</span>
        <span>Cisco Ethical Hacker</span>
      </div>
    </div>
  </section>

  <section class="about-section">
    <div class="about-section__heading">
      <div><p>Elsewhere</p><h2>Find me online</h2></div>
    </div>

    <div class="about-link-grid">
      <a href="{{ '/' | relative_url }}">
        <span><strong>Blog</strong><small>Notes and write-ups</small></span>
      </a>
      <a href="https://profile.hackthebox.com/profile/019dd773-0480-72a9-918b-6f84c2e96be1" target="_blank" rel="noopener noreferrer">
        <span><strong>Hack The Box</strong><small>Academy progress</small></span>
      </a>
      <a href="https://tryhackme.com/p/GekkoGecko" target="_blank" rel="noopener noreferrer">
        <span><strong>TryHackMe</strong><small>Hands-on rooms</small></span>
      </a>
      <a href="https://ctf.osint.industries/users/4244" target="_blank" rel="noopener noreferrer">
        <span><strong>OSINT Industries</strong><small>OSINT challenges</small></span>
      </a>
    </div>
  </section>

  <section class="about-cta">
    <div><p>Let's connect</p><h2>Interested in security, CTFs, or building labs?</h2></div>
    <a class="about-button about-button--primary" href="mailto:{{ site.social.email }}">
      {{ site.social.email }}
    </a>
  </section>
</div>

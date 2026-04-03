## 📋 **DNS Migration Plan: From DNS Parking → GitHub Pages**

### **Current DNS Records (DNS Parking)**
- **A Record**: `@` → `2.57.91.91` (DNS Parking)
- **CNAME Record**: `www` → `pulses.life` (TTL 300)

### **Required DNS Records for GitHub Pages**

#### **1. Apex Domain (pulses.life)**
**DELETE** the current A record and **ADD** these 4 A records:

| Type | Name | Content | TTL |
|------|------|---------|-----|
| A | @ | 185.199.108.153 | 3600 |
| A | @ | 185.199.109.153 | 3600 |
| A | @ | 185.199.110.153 | 3600 |
| A | @ | 185.199.111.153 | 3600 |

#### **2. WWW Subdomain (www.pulses.life)**
**UPDATE** the CNAME record:

| Type | Name | Content | TTL |
|------|------|---------|-----|
| CNAME | www | Meet6338-X.github.io | 3600 |

### **Implementation Steps**

1. **Login to your DNS provider** (Hostinger)
2. **Delete existing records:**
   - Remove A record: `@` → `2.57.91.91`
3. **Add new A records for apex domain:**
   - Add 4 A records pointing to GitHub's IP addresses
4. **Update CNAME record:**
   - Change `www` CNAME from `pulses.life` to `Meet6338-X.github.io`
5. **Wait for DNS propagation** (24-48 hours)
6. **Verify setup** by visiting `https://pulses.life`

### **GitHub Pages Configuration**
✅ **Already Done:**
- CNAME file created: `pulses.life`
- Repository pushed to `Meet6338-X/Pulses.life`
- GitHub Pages enabled

### **Post-Migration**
- Enable HTTPS enforcement in GitHub Pages settings
- Verify domain ownership if needed
- Test both `pulses.life` and `www.pulses.life`

**⚠️ WARNING:** DNS changes take 24-48 hours to propagate globally. Your site may be temporarily unreachable during this period.
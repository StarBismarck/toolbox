## 微信公众号集成配置指南

### 前置条件
- 已认证的微信服务号
- 在微信公众平台后台获取 AppID 和 AppSecret

### 步骤 1：配置微信公众平台
1. 登录 https://mp.weixin.qq.com
2. 左侧菜单 → 设置与开发 → 公众号设置 → 功能设置
3. 设置「网页授权域名」为：`pswiejbqdsvdajzzisgj.supabase.co`
4. 下载域名验证文件，放到 Supabase 可访问的路径

### 步骤 2：部署 Supabase Edge Function
1. 安装 Supabase CLI：`npm install -g supabase`
2. 登录：`supabase login`
3. 链接项目：`supabase link --project-ref pswiejbqdsvdajzzisgj`
4. 设置环境变量：
   ```
   supabase secrets set WECHAT_APP_ID=你的AppID
   supabase secrets set WECHAT_APP_SECRET=你的AppSecret
   supabase secrets set APP_URL=https://StarBismarck.github.io/toolbox
   supabase secrets set SUPABASE_URL=https://pswiejbqdsvdajzzisgj.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=你的service_role密钥
   ```
5. 部署函数：
   ```
   cd ToolBox/supabase
   supabase functions deploy wechat-auth
   ```

### 步骤 3：设置公众号菜单
在微信公众平台 → 自定义菜单 → 添加菜单：
- 菜单名：三队百宝箱
- 类型：跳转网页
- URL：`https://pswiejbqdsvdajzzisgj.supabase.co/functions/v1/wechat-auth`

### 步骤 4：测试
1. 用微信扫公众号二维码关注
2. 点击菜单「三队百宝箱」
3. 自动跳转到微信授权页面
4. 授权后自动登录网站

### 登录流程
```
用户点公众号菜单
  → 跳转到 Edge Function
  → 没有code → 重定向到微信OAuth
  → 用户授权
  → 微信回调带code
  → Edge Function 用code换openid
  → 在Supabase创建/查找用户
  → 生成session token
  → 重定向回网站（已登录）
```

### 前端按钮
网站登录页已有「📱 微信一键登录」按钮
- 在微信内置浏览器中：自动OAuth登录
- 在外部浏览器中：跳转到微信OAuth（需扫码）

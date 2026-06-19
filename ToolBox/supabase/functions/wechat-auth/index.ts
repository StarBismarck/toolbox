// Supabase Edge Function: WeChat OAuth
// Deploy: supabase functions deploy wechat-auth

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WECHAT_APP_ID = Deno.env.get("WECHAT_APP_ID") || "";
const WECHAT_APP_SECRET = Deno.env.get("WECHAT_APP_SECRET") || "";
const APP_URL = Deno.env.get("APP_URL") || "https://StarBismarck.github.io/toolbox";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";

  // Step 1: No code → redirect to WeChat OAuth
  if (!code) {
    const redirectUri = `${url.origin}/wechat-auth`;
    const scope = "snsapi_userinfo";
    const wechatUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WECHAT_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
    
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, "Location": wechatUrl },
    });
  }

  // Step 2: Exchange code for access token
  try {
    const tokenResp = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}&code=${code}&grant_type=authorization_code`
    );
    const tokenData = await tokenResp.json();
    
    if (tokenData.errcode) {
      return new Response(JSON.stringify({ error: tokenData.errmsg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openid = tokenData.openid;
    const accessToken = tokenData.access_token;

    // Step 3: Get user info (nickname, avatar)
    let nickname = "";
    let avatar = "";
    try {
      const userResp = await fetch(
        `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}&lang=zh_CN`
      );
      const userData = await userResp.json();
      nickname = userData.nickname || "";
      avatar = userData.headimgurl || "";
    } catch (e) {
      // User info is optional
    }

    // Step 4: Look up or create user in tb_users
    const usersResp = await fetch(
      `${SUPABASE_URL}/rest/v1/toolbar_data?username=eq._system&data_type=eq._users`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const userRows = await usersResp.json();
    let users = [];
    if (userRows.length > 0 && userRows[0].data_json) {
      users = JSON.parse(userRows[0].data_json);
    }

    // Find existing user by wechatOpenId or create new
    let targetUser = users.find((u: any) => u.wechatOpenId === openid);
    
    if (!targetUser) {
      // Create new user
      const wxUsername = `wx_${openid.substring(0, 8)}`;
      targetUser = {
        id: Date.now(),
        username: wxUsername,
        passwordHash: "", // WeChat users don't need password
        createdAt: new Date().toLocaleString("zh-CN"),
        avatar: avatar || "👤",
        status: "online",
        role: "user",
        friends: [],
        lastSeen: new Date().toLocaleString("zh-CN"),
        wechatOpenId: openid,
        wechatNickname: nickname,
      };
      users.push(targetUser);
    } else {
      // Update existing user
      targetUser.status = "online";
      targetUser.lastSeen = new Date().toLocaleString("zh-CN");
      if (nickname) targetUser.wechatNickname = nickname;
      if (avatar) targetUser.avatar = avatar;
    }

    // Save users back
    const updatedJson = JSON.stringify(users);
    
    // DELETE old
    await fetch(
      `${SUPABASE_URL}/rest/v1/toolbar_data?username=eq._system&data_type=eq._users`,
      {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    
    // POST new
    await fetch(`${SUPABASE_URL}/rest/v1/toolbar_data`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        username: "_system",
        data_type: "_users",
        data_json: updatedJson,
        updated_at: new Date().toISOString(),
      }),
    });

    // Step 5: Generate session token and redirect
    const sessionToken = btoa(`${targetUser.username}:${openid}:${Date.now()}`);
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": `${APP_URL}?wx_token=${encodeURIComponent(sessionToken)}`,
      },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

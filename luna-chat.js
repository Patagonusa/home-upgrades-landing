// Luna Chat Widget — California Home Upgrades Program
// Adapted from HPP luna-chat.js — connects to Patagon CRM chat API
(function() {
  'use strict';

  var API_BASE = 'https://www.salesdispatch.ai/api/chat';
  var APPEAR_DELAY = 15000;
  var AUTO_OPEN_DELAY = 5000;
  var LANG = document.documentElement.lang === 'es' ? 'es' : 'en';

  var STR = {
    en: {
      greeting: 'Limited 2026 spots — questions?',
      title: 'Luna',
      subtitle: 'Home Upgrades Program',
      placeholder: 'Type a message...',
      send: 'Send',
      close: 'Close chat',
      offline: 'Connection issue. Please try again.',
      rateLimit: 'Please wait a moment before sending another message.',
    },
    es: {
      greeting: 'Cupos 2026 limitados \u2014 \u00bfpreguntas?',
      title: 'Luna',
      subtitle: 'Programa de Mejoras del Hogar',
      placeholder: 'Escribe un mensaje...',
      send: 'Enviar',
      close: 'Cerrar chat',
      offline: 'Problema de conexi\u00f3n. Int\u00e9ntalo de nuevo.',
      rateLimit: 'Por favor espera un momento antes de enviar otro mensaje.',
    }
  };
  var S = STR[LANG] || STR.en;

  var PAGE_GREETINGS = {
    en: {
      index: "Hi there! I'm Luna with the California Home Upgrades Program. Quick heads up \u2014 our 2026 enrollment is limited and the No-Payments-Until-2028 financing offer is closing soon, so I want to help you lock in a spot before it's gone. I can help with bathroom, roofing, windows, flooring, HVAC, solar, kitchens, and exterior projects. Want a free in-home estimate? Ask me anything or fill out the quick form above!",
      default: "Hi! I'm Luna with the California Home Upgrades Program. Spots for the No-Payments-Until-2028 financing offer are limited and filling up fast \u2014 I want to make sure you get yours locked in before the 2026 enrollment window closes. Ask me anything about the free in-home assessment, written estimates, financing, or rebate programs!"
    },
    es: {
      index: "\u00a1Hola! Soy Luna, del Programa de Mejoras del Hogar de California. Importante \u2014 los cupos para 2026 son limitados y la oferta de Sin Pagos Hasta 2028 est\u00e1 cerrando pronto, as\u00ed que quiero ayudarte a asegurar tu lugar antes de que se acabe. Puedo ayudarte con ba\u00f1os, techos, ventanas, pisos, HVAC, energ\u00eda solar, cocinas y proyectos exteriores. \u00bfQuieres un estimado gratis a domicilio? \u00a1Preg\u00fantame lo que quieras o llena el formulario r\u00e1pido arriba!",
      default: "\u00a1Hola! Soy Luna, del Programa de Mejoras del Hogar de California. Los cupos para la oferta Sin Pagos Hasta 2028 son limitados y se est\u00e1n llenando r\u00e1pido \u2014 quiero asegurarme que reserves el tuyo antes que cierre el per\u00edodo de inscripci\u00f3n 2026. \u00a1Preg\u00fantame lo que quieras sobre la evaluaci\u00f3n gratis, estimados por escrito, financiamiento o programas de reembolso!"
    }
  };

  function detectPageContext() {
    var path = window.location.pathname.toLowerCase();
    var greetings = PAGE_GREETINGS[LANG] || PAGE_GREETINGS.en;
    if (path === '/' || path.indexOf('index') !== -1 || path.endsWith('/es.html')) return greetings.index;
    return greetings.default;
  }

  var sessionId = localStorage.getItem('luna_session_id') || null;
  var visitorId = localStorage.getItem('luna_visitor_id');
  if (!visitorId) {
    visitorId = crypto.randomUUID ? crypto.randomUUID() : 'v-' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
    localStorage.setItem('luna_visitor_id', visitorId);
  }
  var isOpen = false;
  var isLoading = false;
  var messages = [];
  var dismissed = localStorage.getItem('luna_dismissed') === '1';

  if (!sessionStorage.getItem('luna_session_active')) {
    sessionStorage.setItem('luna_session_active', '1');
    localStorage.removeItem('luna_auto_greeted');
    localStorage.removeItem('luna_session_id');
    sessionId = null;
  }
  var hasAutoGreeted = localStorage.getItem('luna_auto_greeted') === '1';

  var css = document.createElement('style');
  css.textContent = [
    '#luna-widget{position:fixed;bottom:24px;right:24px;z-index:9998;font-family:"Inter",-apple-system,sans-serif;}',
    '#luna-bubble{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#059669,#10b981);color:#fff;border:none;cursor:pointer;box-shadow:0 4px 24px rgba(5,150,105,0.4);display:flex;align-items:center;justify-content:center;transition:transform 0.2s,box-shadow 0.2s;position:relative;}',
    '#luna-bubble:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(5,150,105,0.5);}',
    '#luna-bubble svg{width:32px;height:32px;}',
    '#luna-dot{position:absolute;top:2px;right:2px;width:14px;height:14px;background:#f59e0b;border-radius:50%;border:2px solid #fff;display:none;animation:luna-pulse 2s infinite;}',
    '@keyframes luna-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.2);}}',
    '#luna-tooltip{position:absolute;bottom:72px;right:0;background:#fff;color:#1e293b;padding:10px 16px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.15);font-size:14px;font-weight:600;white-space:nowrap;display:none;pointer-events:none;}',
    '#luna-tooltip::after{content:"";position:absolute;bottom:-6px;right:24px;width:12px;height:12px;background:#fff;transform:rotate(45deg);box-shadow:2px 2px 4px rgba(0,0,0,0.05);}',
    '#luna-panel{display:none;position:fixed;bottom:24px;right:24px;width:400px;height:560px;background:#fff;border-radius:16px;box-shadow:0 10px 50px rgba(0,0,0,0.2);flex-direction:column;overflow:hidden;z-index:9999;}',
    '#luna-panel.open{display:flex;}',
    '#luna-header{background:linear-gradient(135deg,#064e3b,#065f46);color:#fff;padding:16px 20px;display:flex;align-items:center;gap:12px;flex-shrink:0;}',
    '#luna-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#059669,#34d399);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0;}',
    '#luna-header-info{flex:1;}',
    '#luna-header-info h3{font-size:16px;font-weight:700;margin:0;line-height:1.2;}',
    '#luna-header-info p{font-size:12px;color:#94a3b8;margin:0;}',
    '#luna-close{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:24px;padding:4px 8px;line-height:1;border-radius:6px;}',
    '#luna-close:hover{color:#fff;background:rgba(255,255,255,0.1);}',
    '#luna-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f0fdf4;}',
    '.luna-msg{max-width:82%;padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word;animation:luna-fade 0.3s ease;}',
    '@keyframes luna-fade{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}',
    '.luna-msg.assistant{background:#fff;color:#1e293b;border:1px solid #d1fae5;border-bottom-left-radius:4px;align-self:flex-start;box-shadow:0 1px 4px rgba(0,0,0,0.04);}',
    '.luna-msg.user{background:linear-gradient(135deg,#059669,#10b981);color:#fff;border-bottom-right-radius:4px;align-self:flex-end;}',
    '.luna-typing{display:none;align-self:flex-start;padding:12px 20px;background:#fff;border:1px solid #d1fae5;border-radius:16px;border-bottom-left-radius:4px;}',
    '.luna-typing span{display:inline-block;width:8px;height:8px;background:#94a3b8;border-radius:50%;margin:0 2px;animation:luna-bounce 1.4s infinite;}',
    '.luna-typing span:nth-child(2){animation-delay:0.2s;}',
    '.luna-typing span:nth-child(3){animation-delay:0.4s;}',
    '@keyframes luna-bounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}',
    '#luna-input-area{display:flex;gap:8px;padding:12px 16px;border-top:1px solid #d1fae5;background:#fff;flex-shrink:0;}',
    '#luna-input{flex:1;border:1px solid #d1fae5;border-radius:24px;padding:10px 18px;font-size:14px;font-family:inherit;outline:none;transition:border-color 0.2s;resize:none;}',
    '#luna-input:focus{border-color:#059669;}',
    '#luna-send{width:40px;height:40px;border-radius:50%;background:#059669;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;flex-shrink:0;}',
    '#luna-send:hover{background:#047857;}',
    '#luna-send:disabled{background:#94a3b8;cursor:default;}',
    '#luna-send svg{width:18px;height:18px;}',
    '@media(max-width:480px){',
    '  #luna-panel{bottom:0;right:0;left:0;width:100%;height:100%;border-radius:0;}',
    '  #luna-widget{bottom:16px;right:16px;}',
    '}',
  ].join('\n');
  document.head.appendChild(css);

  var widget = document.createElement('div');
  widget.id = 'luna-widget';
  widget.innerHTML = [
    '<div id="luna-tooltip">' + S.greeting + '</div>',
    '<button id="luna-bubble" aria-label="Chat with Luna">',
    '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    '  <span id="luna-dot"></span>',
    '</button>',
    '<div id="luna-panel">',
    '  <div id="luna-header">',
    '    <div id="luna-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px"><path d="M12 8V4H8"/><rect x="5" y="8" width="14" height="12" rx="2"/><line x1="9" y1="13" x2="9" y2="13.01"/><line x1="15" y1="13" x2="15" y2="13.01"/><path d="M10 17h4"/></svg></div>',
    '    <div id="luna-header-info">',
    '      <h3>' + S.title + '</h3>',
    '      <p>' + S.subtitle + '</p>',
    '    </div>',
    '    <button id="luna-close" aria-label="' + S.close + '">&times;</button>',
    '  </div>',
    '  <div id="luna-messages">',
    '    <div class="luna-typing" id="luna-typing"><span></span><span></span><span></span></div>',
    '  </div>',
    '  <div id="luna-input-area">',
    '    <input type="text" id="luna-input" placeholder="' + S.placeholder + '" autocomplete="off" maxlength="1000">',
    '    <button id="luna-send" aria-label="' + S.send + '">',
    '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    '    </button>',
    '  </div>',
    '</div>',
  ].join('');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  function mount() {
    document.body.appendChild(widget);
    var bubble = document.getElementById('luna-bubble');
    var closeBtn = document.getElementById('luna-close');
    var input = document.getElementById('luna-input');
    var sendBtn = document.getElementById('luna-send');
    var dot = document.getElementById('luna-dot');
    var tooltip = document.getElementById('luna-tooltip');

    widget.style.display = 'none';
    if (!dismissed) {
      setTimeout(function() {
        widget.style.display = 'block';
        setTimeout(function() {
          if (!isOpen) {
            dot.style.display = 'block';
            tooltip.style.display = 'block';
            setTimeout(function() { tooltip.style.display = 'none'; }, 8000);
          }
        }, 3000);

        if (!hasAutoGreeted) {
          setTimeout(function() {
            if (!isOpen) { autoGreet(); }
          }, AUTO_OPEN_DELAY);
        }
      }, APPEAR_DELAY);
    }

    bubble.addEventListener('click', function() { openChat(); });
    closeBtn.addEventListener('click', function() { closeChat(); });
    sendBtn.addEventListener('click', function() { sendMessage(); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  function autoGreet() {
    var greeting = detectPageContext();
    isOpen = true;
    document.getElementById('luna-panel').classList.add('open');
    document.getElementById('luna-bubble').style.display = 'none';
    document.getElementById('luna-tooltip').style.display = 'none';
    document.getElementById('luna-dot').style.display = 'none';
    addMessage('assistant', greeting);
    localStorage.setItem('luna_auto_greeted', '1');
    hasAutoGreeted = true;
    startSession(true);
  }

  function openChat() {
    isOpen = true;
    document.getElementById('luna-panel').classList.add('open');
    document.getElementById('luna-bubble').style.display = 'none';
    document.getElementById('luna-tooltip').style.display = 'none';
    document.getElementById('luna-dot').style.display = 'none';
    document.getElementById('luna-input').focus();
    if (messages.length === 0) {
      addMessage('assistant', detectPageContext());
      if (!sessionId) startSession(true);
    } else if (!sessionId) {
      startSession(false);
    }
  }

  function closeChat() {
    isOpen = false;
    document.getElementById('luna-panel').classList.remove('open');
    document.getElementById('luna-bubble').style.display = 'flex';
  }

  function startSession(skipGreeting) {
    fetch(API_BASE + '/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_id: visitorId, language: LANG, page_url: window.location.href }),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.session_id) {
        sessionId = data.session_id;
        localStorage.setItem('luna_session_id', sessionId);
        if (data.resumed && !skipGreeting) {
          showTyping();
          sendToAPI(LANG === 'es' ? 'Hola, volv\u00ed' : 'Hi, I\'m back');
        }
      }
    })
    .catch(function() { if (!skipGreeting) addMessage('assistant', S.offline); });
  }

  function sendMessage() {
    var input = document.getElementById('luna-input');
    var text = input.value.trim();
    if (!text || isLoading) return;
    input.value = '';
    addMessage('user', text);
    showTyping();
    if (!sessionId) { startSession(false); return; }
    sendToAPI(text);
  }

  function sendToAPI(text) {
    isLoading = true;
    updateSendButton();
    fetch(API_BASE + '/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message: text, visitor_id: visitorId }),
    })
    .then(function(r) {
      if (r.status === 429) { hideTyping(); isLoading = false; updateSendButton(); addMessage('assistant', S.rateLimit); return null; }
      return r.json();
    })
    .then(function(data) {
      hideTyping(); isLoading = false; updateSendButton();
      if (!data) return;
      if (data.reply) addMessage('assistant', data.reply);
      if (data.lead_created) try { window.dispatchEvent(new Event('luna_lead_created')); } catch(e) {}
      if (data.session_status === 'closed' || data.session_status === 'escalated') { sessionId = null; localStorage.removeItem('luna_session_id'); }
    })
    .catch(function() { hideTyping(); isLoading = false; updateSendButton(); addMessage('assistant', S.offline); });
  }

  function addMessage(role, text) {
    var container = document.getElementById('luna-messages');
    var typing = document.getElementById('luna-typing');
    var div = document.createElement('div');
    div.className = 'luna-msg ' + role;
    div.textContent = text;
    container.insertBefore(div, typing);
    container.scrollTop = container.scrollHeight;
    messages.push({ role: role, text: text });
  }

  function showTyping() { var t = document.getElementById('luna-typing'); t.style.display = 'block'; document.getElementById('luna-messages').scrollTop = document.getElementById('luna-messages').scrollHeight; }
  function hideTyping() { document.getElementById('luna-typing').style.display = 'none'; }
  function updateSendButton() { document.getElementById('luna-send').disabled = isLoading; }
})();

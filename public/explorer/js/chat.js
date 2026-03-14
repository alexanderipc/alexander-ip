// ═══════════════════════════════════════════════════
// AI Chat Panel — Claude-powered patent Q&A
// ═══════════════════════════════════════════════════

export class ChatPanel {
  constructor(chatEl) {
    this.el = chatEl;
    this.messagesEl = chatEl.querySelector('.chat-messages');
    this.inputEl = chatEl.querySelector('.chat-input');
    this.sendBtn = chatEl.querySelector('.chat-send');
    this.portfolio = null;
    this.messages = []; // conversation history
    this.isStreaming = false;
    this.isMobile = window.innerWidth <= 768;

    this.sendBtn.addEventListener('click', () => this.send());
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
    });

    // Toggle button (desktop)
    const toggle = chatEl.querySelector('.chat-toggle');
    if (toggle) toggle.addEventListener('click', () => this.el.classList.toggle('collapsed'));

    // Mobile chat wiring
    this._initMobileChat();
  }

  _initMobileChat() {
    const sheet = document.getElementById('mobile-chat-sheet');
    const toggleBtn = document.getElementById('mobile-chat-toggle');
    const sendBtn = document.getElementById('mobile-chat-send');
    const inputEl = document.getElementById('mobile-chat-input');
    if (!sheet || !toggleBtn) return;

    this.mobileSheet = sheet;
    this.mobileMessagesEl = document.getElementById('mobile-chat-messages');
    this.mobileInputEl = inputEl;
    this.mobileSendBtn = sendBtn;

    toggleBtn.addEventListener('click', () => {
      sheet.classList.toggle('expanded');
      const chevron = toggleBtn.querySelector('.mobile-chevron');
      if (chevron) chevron.textContent = sheet.classList.contains('expanded') ? '\u25BC' : '\u25B2';
    });

    sendBtn?.addEventListener('click', () => this._mobileSend());
    inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._mobileSend(); }
    });
  }

  _mobileSend() {
    if (!this.mobileInputEl) return;
    const text = this.mobileInputEl.value.trim();
    if (!text || this.isStreaming) return;
    this.inputEl.value = text;
    this.mobileInputEl.value = '';
    this.send();
  }

  setPortfolio(portfolio) {
    this.portfolio = portfolio;
    this.messages = [];
    this.messagesEl.innerHTML = '';
    if (this.mobileMessagesEl) this.mobileMessagesEl.innerHTML = '';
    this._showStarters();
  }

  _showStarters() {
    const starters = [
      'What does this portfolio cover and how is it structured?',
      'Walk me through the strategy behind how this portfolio was built.',
      'What makes these patents difficult for competitors to design around?',
      'How do the patent families relate to each other?',
      'What geographic coverage does this portfolio have?',
    ];

    let html = '<div class="chat-starters">';
    html += '<div class="chat-starters-title">Ask about this portfolio</div>';
    starters.forEach(q => {
      html += `<button class="chat-starter" data-q="${q}">${q}</button>`;
    });
    html += '</div>';
    this.messagesEl.innerHTML = html;

    this.messagesEl.querySelectorAll('.chat-starter').forEach(btn => {
      btn.addEventListener('click', () => {
        this.inputEl.value = btn.dataset.q;
        this.send();
      });
    });

    // Mirror starters to mobile
    if (this.mobileMessagesEl) {
      this.mobileMessagesEl.innerHTML = html;
      this.mobileMessagesEl.querySelectorAll('.chat-starter').forEach(btn => {
        btn.addEventListener('click', () => {
          this.inputEl.value = btn.dataset.q;
          this.send();
        });
      });
    }
  }

  async send() {
    const text = this.inputEl.value.trim();
    if (!text || this.isStreaming) return;

    // Remove starters (desktop + mobile)
    const starters = this.messagesEl.querySelector('.chat-starters');
    if (starters) starters.remove();
    if (this.mobileMessagesEl) {
      const mobileStarters = this.mobileMessagesEl.querySelector('.chat-starters');
      if (mobileStarters) mobileStarters.remove();
    }

    // Add user message
    this.messages.push({ role: 'user', content: text });
    this._appendMessage('user', text);
    this.inputEl.value = '';
    this.isStreaming = true;
    this.sendBtn.disabled = true;

    // Create assistant message placeholder
    const assistantEl = this._appendMessage('assistant', '');
    const contentEl = assistantEl.querySelector('.chat-content');
    const mobileContentEl = assistantEl._mobileClone?.querySelector('.chat-content');
    contentEl.innerHTML = '<span class="chat-typing-dots"><span></span><span></span><span></span></span>';
    if (mobileContentEl) mobileContentEl.innerHTML = contentEl.innerHTML;

    try {
      const res = await fetch('/api/explorer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.messages,
          portfolio: this.portfolio
        })
      });

      if (!res.ok) throw new Error(`Chat failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      contentEl.innerHTML = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              const rendered = this._renderMarkdown(fullText);
              contentEl.innerHTML = rendered;
              if (mobileContentEl) mobileContentEl.innerHTML = rendered;
              this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
              if (this.mobileMessagesEl) this.mobileMessagesEl.scrollTop = this.mobileMessagesEl.scrollHeight;
            }
            if (parsed.error) {
              const errHtml = `<div class="chat-error">${parsed.error}</div>`;
              contentEl.innerHTML += errHtml;
              if (mobileContentEl) mobileContentEl.innerHTML += errHtml;
            }
          } catch {}
        }
      }

      this.messages.push({ role: 'assistant', content: fullText });

    } catch (err) {
      const errHtml = `<div class="chat-error">Error: ${err.message}</div>`;
      contentEl.innerHTML = errHtml;
      if (mobileContentEl) mobileContentEl.innerHTML = errHtml;
    } finally {
      this.isStreaming = false;
      this.sendBtn.disabled = false;
      if (this.mobileSendBtn) this.mobileSendBtn.disabled = false;
      if (window.innerWidth <= 768 && this.mobileInputEl) {
        this.mobileInputEl.focus();
      } else {
        this.inputEl.focus();
      }
    }
  }

  _appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `chat-message chat-${role}`;
    const avatar = role === 'user' ? 'You' :
      `<svg class="ai-avatar-svg" viewBox="0 0 28 28" width="18" height="18">
        <circle cx="14" cy="14" r="12" fill="none" stroke="#3b82f6" stroke-width="1.5" class="ai-avatar-ring"/>
        <circle cx="14" cy="14" r="4" fill="#3b82f6" class="ai-avatar-core"/>
      </svg>`;
    div.innerHTML = `
      <div class="chat-avatar">${avatar}</div>
      <div class="chat-bubble">
        <div class="chat-content">${text ? this._renderMarkdown(text) : ''}</div>
      </div>`;
    this.messagesEl.appendChild(div);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

    // Mirror to mobile
    if (this.mobileMessagesEl) {
      const clone = div.cloneNode(true);
      this.mobileMessagesEl.appendChild(clone);
      this.mobileMessagesEl.scrollTop = this.mobileMessagesEl.scrollHeight;
      div._mobileClone = clone;
    }

    return div;
  }

  _renderMarkdown(text) {
    let html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    html = html
      .replace(/<p><\/p>/g, '')
      .replace(/<\/h[234]><br>/g, m => m.replace('<br>', ''))
      .replace(/<\/ul><br>/g, '</ul>');
    return html;
  }
}

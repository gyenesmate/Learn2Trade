import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { WS_RECONNECT_BASE_MS, WS_RECONNECT_MAX_MS } from './websocket.const';
import { WebSocketConnectionState } from './websocket.types';

/**
 * Low-level single-socket transport. No domain/crypto knowledge.
 * One physical connection per app; reconnects on unexpected close.
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string | null = null;
  private intentionalClose = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly messagesSubject = new Subject<unknown>();
  private readonly stateSignal = signal<WebSocketConnectionState>('disconnected');

  readonly messages$: Observable<unknown> = this.messagesSubject.asObservable();
  readonly state = this.stateSignal.asReadonly();

  connect(url: string): void {
    if (
      this.url === url &&
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.clearReconnectTimer();
    this.intentionalClose = false;
    this.url = url;
    this.openSocket(url, this.stateSignal() === 'reconnecting' ? 'reconnecting' : 'connecting');
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.reconnectAttempt = 0;
    this.url = null;
    this.closeSocket();
    this.stateSignal.set('disconnected');
  }

  send(data: unknown): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.socket.send(payload);
  }

  private openSocket(url: string, nextState: WebSocketConnectionState): void {
    this.closeSocket();
    this.stateSignal.set(nextState);

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.reconnectAttempt = 0;
      this.stateSignal.set('connected');
    };

    socket.onmessage = (ev) => {
      if (this.socket !== socket) return;
      try {
        const parsed: unknown =
          typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
        this.messagesSubject.next(parsed);
      } catch {
        this.messagesSubject.next(ev.data);
      }
    };

    socket.onerror = () => {
      // onclose handles reconnect; avoid duplicate work
    };

    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      if (this.intentionalClose || !this.url) {
        this.stateSignal.set('disconnected');
        return;
      }
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    this.stateSignal.set('reconnecting');
    this.clearReconnectTimer();
    const delay = Math.min(
      WS_RECONNECT_BASE_MS * 2 ** this.reconnectAttempt,
      WS_RECONNECT_MAX_MS
    );
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.intentionalClose || !this.url) return;
      this.openSocket(this.url, 'reconnecting');
    }, delay);
  }

  private closeSocket(): void {
    if (!this.socket) return;
    const socket = this.socket;
    this.socket = null;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    try {
      socket.close();
    } catch {
      // ignore
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer == null) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}

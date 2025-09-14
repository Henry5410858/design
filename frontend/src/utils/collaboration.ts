/**
 * Advanced Collaboration System
 * Real-time editing, comments, team management, version control
 */

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'online' | 'offline' | 'away';
  cursor?: {
    x: number;
    y: number;
    color: string;
  };
  selection?: {
    objectId: string;
    timestamp: number;
  };
}

export interface CollaborationSession {
  id: string;
  designId: string;
  title: string;
  ownerId: string;
  participants: CollaborationUser[];
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  permissions: {
    canEdit: string[];
    canComment: string[];
    canView: string[];
  };
}

export interface Comment {
  id: string;
  designId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  position?: {
    x: number;
    y: number;
    objectId?: string;
  };
  status: 'open' | 'resolved' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  replies: CommentReply[];
  mentions: string[];
}

export interface CommentReply {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
}

export interface DesignVersion {
  id: string;
  designId: string;
  version: number;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  data: any; // Design data snapshot
  thumbnail?: string;
  changes: string[];
  isAutoSave: boolean;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMember[];
  settings: {
    allowGuestAccess: boolean;
    requireApprovalForJoins: boolean;
    defaultRole: 'editor' | 'viewer';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
  permissions: {
    canInvite: boolean;
    canRemoveMembers: boolean;
    canManageSettings: boolean;
  };
}

export interface SharedLibrary {
  id: string;
  name: string;
  description?: string;
  teamId?: string;
  ownerId: string;
  type: 'brand-assets' | 'templates' | 'fonts' | 'images';
  items: SharedLibraryItem[];
  permissions: {
    canView: string[];
    canEdit: string[];
    canAdd: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedLibraryItem {
  id: string;
  name: string;
  type: 'image' | 'logo' | 'font' | 'template' | 'color';
  data: any;
  metadata: {
    size?: number;
    dimensions?: { width: number; height: number };
    format?: string;
    tags: string[];
  };
  uploadedBy: string;
  uploadedAt: Date;
}

export interface RealtimeEvent {
  type: 'cursor-move' | 'object-select' | 'object-modify' | 'object-add' | 'object-delete' | 'comment-add' | 'comment-update' | 'user-join' | 'user-leave';
  userId: string;
  timestamp: number;
  data: any;
}

export class CollaborationManager {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor() {
    this.setupEventHandlers();
  }

  /**
   * Initialize collaboration session
   */
  async initializeSession(designId: string, userId: string): Promise<CollaborationSession> {
    this.userId = userId;
    this.sessionId = `session_${designId}_${Date.now()}`;
    
    try {
      // Connect to WebSocket
      await this.connectWebSocket();
      
      // Create or join session
      const session = await this.createOrJoinSession(designId, userId);
      
      // Start heartbeat
      this.startHeartbeat();
      
      return session;
    } catch (error) {
      console.error('Failed to initialize collaboration session:', error);
      throw error;
    }
  }

  /**
   * Connect to WebSocket server
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/collaboration';
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('🔗 Collaboration WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };
      
      this.ws.onclose = () => {
        console.log('🔌 Collaboration WebSocket disconnected');
        this.handleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ Collaboration WebSocket error:', error);
        reject(error);
      };
    });
  }

  /**
   * Handle WebSocket reconnection
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket().catch(console.error);
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('connection-lost', { attempts: this.reconnectAttempts });
    }
  }

  /**
   * Create or join collaboration session
   */
  private async createOrJoinSession(designId: string, userId: string): Promise<CollaborationSession> {
    const message = {
      type: 'join-session',
      sessionId: this.sessionId,
      designId,
      userId,
      timestamp: Date.now()
    };
    
    this.send(message);
    
    // Wait for session confirmation
    return new Promise((resolve) => {
      const handler = (session: CollaborationSession) => {
        this.off('session-joined', handler);
        resolve(session);
      };
      this.on('session-joined', handler);
    });
  }

  /**
   * Send real-time event
   */
  sendEvent(event: RealtimeEvent): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  /**
   * Send WebSocket message
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'session-joined':
          this.emit('session-joined', message.session);
          break;
          
        case 'user-joined':
          this.emit('user-joined', message.user);
          break;
          
        case 'user-left':
          this.emit('user-left', message.userId);
          break;
          
        case 'cursor-move':
          this.emit('cursor-move', message);
          break;
          
        case 'object-select':
          this.emit('object-select', message);
          break;
          
        case 'object-modify':
          this.emit('object-modify', message);
          break;
          
        case 'comment-add':
          this.emit('comment-add', message.comment);
          break;
          
        case 'comment-update':
          this.emit('comment-update', message.comment);
          break;
          
        case 'design-update':
          this.emit('design-update', message.data);
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Send cursor position
   */
  sendCursorPosition(x: number, y: number, color: string = '#FF6B6B'): void {
    this.sendEvent({
      type: 'cursor-move',
      userId: this.userId!,
      timestamp: Date.now(),
      data: { x, y, color }
    });
  }

  /**
   * Send object selection
   */
  sendObjectSelection(objectId: string): void {
    this.sendEvent({
      type: 'object-select',
      userId: this.userId!,
      timestamp: Date.now(),
      data: { objectId }
    });
  }

  /**
   * Send object modification
   */
  sendObjectModification(objectId: string, changes: any): void {
    this.sendEvent({
      type: 'object-modify',
      userId: this.userId!,
      timestamp: Date.now(),
      data: { objectId, changes }
    });
  }

  /**
   * Add comment
   */
  async addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies'>): Promise<Comment> {
    const newComment: Comment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: []
    };
    
    // Send to server
    this.send({
      type: 'comment-add',
      comment: newComment
    });
    
    // Emit locally
    this.emit('comment-add', newComment);
    
    return newComment;
  }

  /**
   * Reply to comment
   */
  async replyToComment(commentId: string, reply: Omit<CommentReply, 'id' | 'createdAt'>): Promise<CommentReply> {
    const newReply: CommentReply = {
      ...reply,
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    
    // Send to server
    this.send({
      type: 'comment-reply',
      commentId,
      reply: newReply
    });
    
    return newReply;
  }

  /**
   * Save design version
   */
  async saveVersion(version: Omit<DesignVersion, 'id' | 'createdAt'>): Promise<DesignVersion> {
    const newVersion: DesignVersion = {
      ...version,
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    
    // Send to server
    this.send({
      type: 'save-version',
      version: newVersion
    });
    
    return newVersion;
  }

  /**
   * Get design history
   */
  async getDesignHistory(designId: string): Promise<DesignVersion[]> {
    // This would typically fetch from server
    // For now, return mock data
    return [
      {
        id: 'v1',
        designId,
        version: 1,
        name: 'Initial Design',
        description: 'First version of the design',
        createdBy: this.userId!,
        createdAt: new Date(Date.now() - 86400000),
        data: {},
        changes: ['Created initial layout'],
        isAutoSave: false
      }
    ];
  }

  /**
   * Create team
   */
  async createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const newTeam: Team = {
      ...team,
      id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Send to server
    this.send({
      type: 'create-team',
      team: newTeam
    });
    
    return newTeam;
  }

  /**
   * Invite user to team
   */
  async inviteToTeam(teamId: string, email: string, role: 'admin' | 'editor' | 'viewer'): Promise<void> {
    this.send({
      type: 'invite-to-team',
      teamId,
      email,
      role
    });
  }

  /**
   * Create shared library
   */
  async createSharedLibrary(library: Omit<SharedLibrary, 'id' | 'createdAt' | 'updatedAt'>): Promise<SharedLibrary> {
    const newLibrary: SharedLibrary = {
      ...library,
      id: `library_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Send to server
    this.send({
      type: 'create-library',
      library: newLibrary
    });
    
    return newLibrary;
  }

  /**
   * Start heartbeat to maintain connection
   */
  private startHeartbeat(): void {
    setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          userId: this.userId,
          timestamp: Date.now()
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Event handling system
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * Setup default event handlers
   */
  private setupEventHandlers(): void {
    // Default handlers can be added here
  }

  /**
   * Cleanup and disconnect
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
    this.sessionId = null;
    this.userId = null;
  }
}

// Export default instance
export const collaborationManager = new CollaborationManager();

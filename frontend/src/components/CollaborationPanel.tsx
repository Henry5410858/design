'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CollaborationManager, 
  CollaborationUser, 
  Comment, 
  DesignVersion, 
  Team,
  SharedLibrary
} from '@/utils/collaboration';
import { 
  Users, 
  MessageSquare, 
  Clock, 
  UserPlus, 
  Settings, 
  Download,
  Upload,
  Share2,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Send,
  Smile,
  Paperclip,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Smartphone
} from 'lucide-react';

interface CollaborationPanelProps {
  designId: string;
  currentUserId: string;
  onClose?: () => void;
  onVersionSelect?: (version: DesignVersion) => void;
}

export default function CollaborationPanel({ 
  designId, 
  currentUserId, 
  onClose, 
  onVersionSelect 
}: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'comments' | 'history' | 'teams' | 'library'>('users');
  const [collaborationManager] = useState(() => new CollaborationManager());
  
  // State
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sharedLibraries, setSharedLibraries] = useState<SharedLibrary[]>([]);
  
  // UI State
  const [isConnected, setIsConnected] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // Refs
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializeCollaboration();
    setupEventHandlers();
    
    return () => {
      collaborationManager.disconnect();
    };
  }, []);

  const initializeCollaboration = useCallback(async () => {
    try {
      const session = await collaborationManager.initializeSession(designId, currentUserId);
      setIsConnected(true);
      setUsers(session.participants);
      console.log('✅ Collaboration session initialized');
    } catch (error) {
      console.error('❌ Failed to initialize collaboration:', error);
    }
  }, [designId, currentUserId, collaborationManager]);

  const setupEventHandlers = useCallback(() => {
    // User events
    collaborationManager.on('user-joined', (user: CollaborationUser) => {
      setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    });

    collaborationManager.on('user-left', (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
    });

    collaborationManager.on('cursor-move', (event: any) => {
      // Update user cursor position
      setUsers(prev => prev.map(user => 
        user.id === event.userId 
          ? { ...user, cursor: { x: event.data.x, y: event.data.y, color: event.data.color } }
          : user
      ));
    });

    // Comment events
    collaborationManager.on('comment-add', (comment: Comment) => {
      setComments(prev => [...prev, comment]);
      scrollToBottom();
    });

    collaborationManager.on('comment-update', (comment: Comment) => {
      setComments(prev => prev.map(c => c.id === comment.id ? comment : c));
    });

    // Connection events
    collaborationManager.on('connection-lost', () => {
      setIsConnected(false);
    });
  }, [collaborationManager]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendComment = useCallback(async () => {
    if (!newComment.trim()) return;

    try {
      await collaborationManager.addComment({
        designId,
        userId: currentUserId,
        userName: 'Usuario Actual', // This would come from user context
        content: newComment.trim(),
        status: 'open',
        mentions: []
      });
      
      setNewComment('');
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  }, [newComment, designId, currentUserId, collaborationManager]);

  const handleReplyToComment = useCallback(async (commentId: string, reply: string) => {
    try {
      await collaborationManager.replyToComment(commentId, {
        commentId: commentId,
        userId: currentUserId,
        userName: 'Usuario Actual',
        content: reply
      });
    } catch (error) {
      console.error('Error replying to comment:', error);
    }
  }, [currentUserId, collaborationManager]);

  const handleInviteUser = useCallback(async (email: string, role: 'editor' | 'viewer') => {
    try {
      // This would typically send an invitation
      console.log(`Inviting ${email} as ${role}`);
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error inviting user:', error);
    }
  }, []);

  const handleCreateTeam = useCallback(async (teamData: any) => {
    try {
      const newTeam = await collaborationManager.createTeam({
        name: teamData.name,
        description: teamData.description,
        ownerId: currentUserId,
        members: [],
        settings: {
          allowGuestAccess: false,
          requireApprovalForJoins: true,
          defaultRole: 'viewer'
        }
      });
      
      setTeams(prev => [...prev, newTeam]);
      setShowTeamModal(false);
    } catch (error) {
      console.error('Error creating team:', error);
    }
  }, [currentUserId, collaborationManager]);

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const getTabIcon = (tab: string) => {
    const icons = {
      users: <Users className="w-4 h-4" />,
      comments: <MessageSquare className="w-4 h-4" />,
      history: <Clock className="w-4 h-4" />,
      teams: <UserPlus className="w-4 h-4" />,
      library: <Share2 className="w-4 h-4" />
    };
    return icons[tab as keyof typeof icons];
  };

  const getUserStatusColor = (status: string) => {
    const colors = {
      online: 'bg-green-500',
      away: 'bg-yellow-500',
      offline: 'bg-gray-400'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Colaboración</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'users', label: 'Usuarios', count: users.length },
          { id: 'comments', label: 'Comentarios', count: comments.length },
          { id: 'history', label: 'Historial', count: versions.length },
          { id: 'teams', label: 'Equipos', count: teams.length },
          { id: 'library', label: 'Biblioteca', count: sharedLibraries.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {getTabIcon(tab.id)}
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'users' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Usuarios Activos</h3>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Invitar
              </button>
            </div>

            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getUserStatusColor(user.status)}`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 truncate">{user.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        user.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'editor' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.status === 'online' ? 'En línea' : 
                       user.status === 'away' ? 'Ausente' : 'Desconectado'}
                    </div>
                  </div>

                  {user.cursor && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: user.cursor.color }}
                      ></div>
                      <span>Editando</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Video Chat Controls */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Chat de Video</h4>
              <div className="flex gap-2">
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isRecording 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isRecording ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  {isRecording ? 'Detener' : 'Iniciar'}
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  <Mic className="w-4 h-4" />
                  Micrófono
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  <Monitor className="w-4 h-4" />
                  Pantalla
                </button>
              </div>
              
              {isRecording && (
                <div className="mt-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-32 bg-gray-200 rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="flex flex-col h-full">
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {comment.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">{comment.userName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleTimeString()}
                        </span>
                        {comment.status === 'resolved' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-2">{comment.content}</p>
                      
                      {comment.position && (
                        <div className="text-xs text-gray-500 mb-2">
                          📍 Posición: ({comment.position.x}, {comment.position.y})
                        </div>
                      )}
                      
                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="ml-4 space-y-2">
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="bg-white rounded p-2 text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-700">{reply.userName}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(reply.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-gray-600">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <button
                        onClick={() => setSelectedComment(comment)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Responder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                  placeholder="Escribe un comentario..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!newComment.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Historial de Versiones</h3>
              <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>

            <div className="space-y-3">
              {versions.map(version => (
                <div key={version.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{version.name}</span>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        v{version.version}
                      </span>
                      {version.isAutoSave && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-600 rounded">
                          Auto
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onVersionSelect?.(version)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{version.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Creado por {version.createdBy}</span>
                    <span>{new Date(version.createdAt).toLocaleString()}</span>
                  </div>
                  
                  {version.changes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Cambios:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {version.changes.map((change, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <span>•</span>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Equipos</h3>
              <button
                onClick={() => setShowTeamModal(true)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Crear Equipo
              </button>
            </div>

            <div className="space-y-3">
              {teams.map(team => (
                <div key={team.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{team.name}</span>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{team.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{team.members.length} miembros</span>
                    <span>Creado {new Date(team.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Biblioteca Compartida</h3>
              <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <Upload className="w-4 h-4" />
                Subir
              </button>
            </div>

            <div className="space-y-3">
              {sharedLibraries.map(library => (
                <div key={library.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{library.name}</span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {library.type}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{library.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{library.items.length} elementos</span>
                    <span>Actualizado {new Date(library.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

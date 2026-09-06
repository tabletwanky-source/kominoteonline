import React, { useState, useEffect } from 'react';
import { Course, CourseModule, Lesson, LessonContentType } from '../../types/database';
import { modulesService, lessonsService, coursesService } from '../../services/firebaseService';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Play,
  FileText,
  Download,
  Video,
  CheckCircle2,
  Eye,
  Lock,
  Layers,
  Sparkles,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface CourseBuilderModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const CourseBuilderModal: React.FC<CourseBuilderModalProps> = ({
  courseId,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);

  // New / Editing Module State
  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');

  // New / Editing Lesson State
  const [isLessonFormOpen, setIsLessonFormOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonData, setLessonData] = useState<{
    title: string;
    description: string;
    content_type: LessonContentType;
    video_url: string;
    file_url: string;
    file_name: string;
    text_content: string;
    duration: string;
    preview_enabled: boolean;
    completion_required: boolean;
  }>({
    title: '',
    description: '',
    content_type: 'youtube',
    video_url: '',
    file_url: '',
    file_name: '',
    text_content: '',
    duration: '10:00',
    preview_enabled: false,
    completion_required: true,
  });

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const c = await coursesService.getBySlugOrId(courseId);
      if (c) {
        setCourse(c);
        const m = await modulesService.getByCourseId(c.id);
        setModules(m);
      }
    } catch (err) {
      console.error('Failed to load course builder data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && courseId) {
      loadData();
    }
  }, [isOpen, courseId]);

  // MODULE HANDLERS
  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;

    setSaving(true);
    try {
      if (editingModuleId) {
        await modulesService.update(editingModuleId, { title: moduleTitle.trim() });
        notify('Modil modifye avèk siksè!');
      } else {
        const nextPos = modules.length + 1;
        await modulesService.create(courseId, moduleTitle.trim(), nextPos);
        notify('Nouvo modil ajoute avèk siksè!');
      }
      setModuleTitle('');
      setEditingModuleId(null);
      setIsModuleFormOpen(false);
      await loadData();
      onSaved();
    } catch (err) {
      console.error('Module save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (modId: string) => {
    if (!window.confirm('Èske ou sèten ou vle efase modil sa a ak tout leson ki ladan li yo?')) return;
    try {
      await modulesService.delete(modId);
      notify('Modil la efase!');
      await loadData();
      onSaved();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const newMods = [...modules];
    const temp = newMods[index];
    newMods[index] = newMods[targetIndex];
    newMods[targetIndex] = temp;

    // Update positions
    const reordered = newMods.map((m, i) => ({ id: m.id, position: i + 1 }));
    setModules(newMods);
    await modulesService.reorder(reordered);
  };

  // LESSON HANDLERS
  const handleOpenAddLesson = (moduleId: string) => {
    setTargetModuleId(moduleId);
    setEditingLessonId(null);
    setLessonData({
      title: '',
      description: '',
      content_type: 'youtube',
      video_url: '',
      file_url: '',
      file_name: '',
      text_content: '',
      duration: '10:00',
      preview_enabled: false,
      completion_required: true,
    });
    setIsLessonFormOpen(true);
  };

  const handleOpenEditLesson = (lesson: Lesson) => {
    setTargetModuleId(lesson.module_id);
    setEditingLessonId(lesson.id);
    setLessonData({
      title: lesson.title,
      description: lesson.description || '',
      content_type: lesson.content_type,
      video_url: lesson.video_url || '',
      file_url: lesson.file_url || '',
      file_name: lesson.file_name || '',
      text_content: lesson.text_content || '',
      duration: lesson.duration || '10:00',
      preview_enabled: lesson.preview_enabled ?? false,
      completion_required: lesson.completion_required ?? true,
    });
    setIsLessonFormOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetModuleId || !lessonData.title.trim()) return;

    setSaving(true);
    try {
      const currentModule = modules.find((m) => m.id === targetModuleId);
      const existingLessons = currentModule?.lessons || [];

      if (editingLessonId) {
        await lessonsService.update(editingLessonId, {
          title: lessonData.title.trim(),
          description: lessonData.description.trim(),
          content_type: lessonData.content_type,
          video_url: lessonData.video_url.trim(),
          file_url: lessonData.file_url.trim(),
          file_name: lessonData.file_name.trim(),
          text_content: lessonData.text_content,
          duration: lessonData.duration.trim() || '10:00',
          preview_enabled: lessonData.preview_enabled,
          completion_required: lessonData.completion_required,
        });
        notify('Leson modifye avèk siksè!');
      } else {
        const nextPos = existingLessons.length + 1;
        await lessonsService.create({
          module_id: targetModuleId,
          course_id: courseId,
          title: lessonData.title.trim(),
          description: lessonData.description.trim(),
          content_type: lessonData.content_type,
          video_url: lessonData.video_url.trim(),
          file_url: lessonData.file_url.trim(),
          file_name: lessonData.file_name.trim(),
          text_content: lessonData.text_content,
          duration: lessonData.duration.trim() || '10:00',
          position: nextPos,
          preview_enabled: lessonData.preview_enabled,
          completion_required: lessonData.completion_required,
        });
        notify('Nouvo leson kreye!');
      }

      setIsLessonFormOpen(false);
      await loadData();
      onSaved();
    } catch (err) {
      console.error('Lesson save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Èske ou sèten ou vle efase leson sa a?')) return;
    try {
      await lessonsService.delete(lessonId);
      notify('Leson efase!');
      await loadData();
      onSaved();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveLesson = async (moduleId: string, lessonIndex: number, direction: 'up' | 'down') => {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod || !mod.lessons) return;

    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= mod.lessons.length) return;

    const newLessons = [...mod.lessons];
    const temp = newLessons[lessonIndex];
    newLessons[lessonIndex] = newLessons[targetIndex];
    newLessons[targetIndex] = temp;

    const reordered = newLessons.map((l, i) => ({ id: l.id, position: i + 1 }));
    await lessonsService.reorder(reordered);
    await loadData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                Konstriktè Kou (Course Builder)
              </span>
              <h2 className="text-base sm:text-lg font-black text-white truncate max-w-lg">
                {course?.title || 'Fòmasyon'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center animate-fadeIn">
            {notification}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Chaje estrikti kou a...</p>
            </div>
          ) : (
            <>
              {/* Modules Header & Add Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Estrikti Modil & Leson ({modules.length} modil)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kreye modil yo, ajoute leson (Videyo, PDF, Tèks), epi òganize lòd la.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingModuleId(null);
                    setModuleTitle('');
                    setIsModuleFormOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajoute Modil</span>
                </button>
              </div>

              {/* Module Form Modal/Inline */}
              {isModuleFormOpen && (
                <form onSubmit={handleSaveModule} className="p-4 bg-white rounded-2xl border border-blue-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-xs text-blue-950">
                    {editingModuleId ? 'Modifye Tit Modil la' : 'Nouvo Modil'}
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      placeholder="egz: Modil 1: Entwodiksyon & Zouti Debaz"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-blue-600"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      {saving ? 'Anrejistre...' : 'Sove Modil'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModuleFormOpen(false)}
                      className="px-3 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      Anile
                    </button>
                  </div>
                </form>
              )}

              {/* Modules List */}
              {modules.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center space-y-2">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Poko gen okenn modil nan kou sa a</p>
                  <p className="text-[11px] text-slate-500">
                    Klike sou bouton "Ajoute Modil" pi wo a pou kòmanse estriktire kou a.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((mod, mIdx) => (
                    <div key={mod.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      {/* Module Bar */}
                      <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {mIdx + 1}
                          </span>
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">{mod.title}</span>
                          <span className="text-[10px] text-slate-500 font-medium ml-2">
                            ({mod.lessons?.length || 0} leson)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Move up / down */}
                          <button
                            onClick={() => handleMoveModule(mIdx, 'up')}
                            disabled={mIdx === 0}
                            className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-20 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Deplase monte"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveModule(mIdx, 'down')}
                            disabled={mIdx === modules.length - 1}
                            className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-20 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Deplase desann"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingModuleId(mod.id);
                              setModuleTitle(mod.title);
                              setIsModuleFormOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Modifye non modil"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteModule(mod.id)}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Efase modil sa a"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenAddLesson(mod.id)}
                            className="ml-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Ajoute Leson</span>
                          </button>
                        </div>
                      </div>

                      {/* Lessons List within this Module */}
                      <div className="divide-y divide-slate-100">
                        {mod.lessons && mod.lessons.length > 0 ? (
                          mod.lessons.map((les, lIdx) => (
                            <div key={les.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-mono text-slate-400 w-5">
                                  {mIdx + 1}.{lIdx + 1}
                                </span>

                                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                                  {les.content_type === 'youtube' || les.content_type === 'vimeo' || les.content_type === 'uploaded_video' ? (
                                    <Video className="w-4 h-4 text-blue-600" />
                                  ) : les.content_type === 'pdf' ? (
                                    <FileText className="w-4 h-4 text-amber-600" />
                                  ) : les.content_type === 'file' ? (
                                    <Download className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-purple-600" />
                                  )}
                                </div>

                                <div>
                                  <span className="font-bold text-xs text-slate-900 block">
                                    {les.title}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                    <span className="uppercase font-semibold text-slate-600">
                                      {les.content_type.replace('_', ' ')}
                                    </span>
                                    <span>•</span>
                                    <span>{les.duration || 'N/A'}</span>
                                    {les.preview_enabled && (
                                      <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[9px]">
                                        Previzyon Gratis
                                      </span>
                                    )}
                                    {les.completion_required === false && (
                                      <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[9px]">
                                        Fakiltatif
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Lesson Controls */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleMoveLesson(mod.id, lIdx, 'up')}
                                  disabled={lIdx === 0}
                                  className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                                  title="Monte"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleMoveLesson(mod.id, lIdx, 'down')}
                                  disabled={lIdx === (mod.lessons?.length || 0) - 1}
                                  className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                                  title="Desann"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditLesson(les)}
                                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                  title="Modifye leson"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(les.id)}
                                  className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                  title="Efase leson"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400 italic">
                            Modil sa a poko gen leson. Klike "Ajoute Leson" pou w mete premye a.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fèmen Konstriktè a
          </button>
        </div>
      </div>

      {/* LESSON CREATE / EDIT MODAL */}
      {isLessonFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                {editingLessonId ? 'Modifye Leson' : 'Ajoute Nouvo Leson'}
              </h3>
              <button
                onClick={() => setIsLessonFormOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tit Leson an *</label>
                <input
                  type="text"
                  required
                  value={lessonData.title}
                  onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                  placeholder="egz: Leson 1: Enstalasyon zouti yo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tip Kontni *</label>
                  <select
                    value={lessonData.content_type}
                    onChange={(e) =>
                      setLessonData({ ...lessonData, content_type: e.target.value as LessonContentType })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-blue-600"
                  >
                    <option value="youtube">YouTube Video</option>
                    <option value="vimeo">Vimeo Video</option>
                    <option value="uploaded_video">Uploaded Video (HTML5)</option>
                    <option value="pdf">Dokiman PDF</option>
                    <option value="file">Fichye Telechajab</option>
                    <option value="text">Leson Tèks / Atik</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dire Estimatif</label>
                  <input
                    type="text"
                    value={lessonData.duration}
                    onChange={(e) => setLessonData({ ...lessonData, duration: e.target.value })}
                    placeholder="12:30"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-blue-600"
                  />
                </div>
              </div>

              {/* Dynamic Content Inputs */}
              {(lessonData.content_type === 'youtube' ||
                lessonData.content_type === 'vimeo' ||
                lessonData.content_type === 'uploaded_video') && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lyen Videyo (URL) *</label>
                  <input
                    type="url"
                    required
                    value={lessonData.video_url}
                    onChange={(e) => setLessonData({ ...lessonData, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-blue-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Platfòm nan ap kontwole vizyonaj elèv la (omwen 90% pou valide otomatikman).
                  </p>
                </div>
              )}

              {(lessonData.content_type === 'pdf' || lessonData.content_type === 'file') && (
                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Lyen Fichye / PDF (URL) *</label>
                    <input
                      type="url"
                      required
                      value={lessonData.file_url}
                      onChange={(e) => setLessonData({ ...lessonData, file_url: e.target.value })}
                      placeholder="https://... /doc.pdf"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Non Fichye a</label>
                    <input
                      type="text"
                      value={lessonData.file_name}
                      onChange={(e) => setLessonData({ ...lessonData, file_name: e.target.value })}
                      placeholder="Plan_Fomasyon.pdf"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-blue-600"
                    />
                  </div>
                </div>
              )}

              {lessonData.content_type === 'text' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kontni Tèks Leson an *</label>
                  <textarea
                    rows={5}
                    required
                    value={lessonData.text_content}
                    onChange={(e) => setLessonData({ ...lessonData, text_content: e.target.value })}
                    placeholder="Ekri kontni leson an isit la..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-blue-600"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kout Deskripsyon Leson an</label>
                <textarea
                  rows={2}
                  value={lessonData.description}
                  onChange={(e) => setLessonData({ ...lessonData, description: e.target.value })}
                  placeholder="Kisa elèv la pral aprann nan leson sa a..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-blue-600"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 flex flex-col gap-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lessonData.preview_enabled}
                    onChange={(e) => setLessonData({ ...lessonData, preview_enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Previzyon Gratis (Preview san peye)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lessonData.completion_required}
                    onChange={(e) => setLessonData({ ...lessonData, completion_required: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Obligatwa pou fini kou a (Konte nan % sètifika)</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLessonFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  {saving ? 'Anrejistre...' : 'Sove Leson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

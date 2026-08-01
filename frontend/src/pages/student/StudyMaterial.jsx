import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiSearch, FiFileText, FiVideo, FiHelpCircle, FiClipboard, FiBook, FiHash, FiDownload, FiExternalLink,
} from 'react-icons/fi';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import studyMaterialsService from '../../services/studyMaterials.service';
import coursesService from '../../services/courses.service';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import useDebounce from '../../hooks/useDebounce';

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'notes', label: 'Notes' },
  { value: 'video', label: 'Video' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'book', label: 'Book' },
  { value: 'formula-sheet', label: 'Formula Sheet' },
];

const TYPE_ICONS = {
  notes: FiFileText,
  video: FiVideo,
  pyq: FiHelpCircle,
  worksheet: FiClipboard,
  book: FiBook,
  'formula-sheet': FiHash,
};

function getId(value) {
  if (!value) return '';
  return typeof value === 'object' ? value._id : value;
}

export default function StudyMaterial() {
  const { user } = useAuth();
  const defaultCourseId = getId(user?.studentProfile?.course);

  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const [courseFilter, setCourseFilter] = useState(defaultCourseId || '');
  const [chapterFilter, setChapterFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    coursesService
      .list()
      .then((res) => setCourses(res.data?.data || []))
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (defaultCourseId && !courseFilter) setCourseFilter(defaultCourseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCourseId]);

  const refreshBookmarks = useCallback(async () => {
    try {
      const res = await studyMaterialsService.bookmarked();
      const ids = new Set((res.data?.data || []).map((m) => m._id));
      setBookmarkedIds(ids);
      return res.data?.data || [];
    } catch {
      return [];
    }
  }, []);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      if (bookmarkedOnly) {
        const bookmarkedList = await refreshBookmarks();
        const filtered = bookmarkedList.filter((m) => {
          if (courseFilter && getId(m.course) !== courseFilter) return false;
          if (chapterFilter && getId(m.chapter) !== chapterFilter) return false;
          if (typeFilter && m.type !== typeFilter) return false;
          if (debouncedSearch && !m.title?.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
          return true;
        });
        setMaterials(filtered);
      } else {
        const params = {};
        if (courseFilter) params.course = courseFilter;
        if (chapterFilter) params.chapter = chapterFilter;
        if (typeFilter) params.type = typeFilter;
        if (debouncedSearch) params.search = debouncedSearch;
        const [listRes] = await Promise.all([studyMaterialsService.list(params), refreshBookmarks()]);
        setMaterials(listRes.data?.data || []);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load study material');
    } finally {
      setLoading(false);
    }
  }, [bookmarkedOnly, courseFilter, chapterFilter, typeFilter, debouncedSearch, refreshBookmarks]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c._id === courseFilter),
    [courses, courseFilter]
  );
  const chapters = selectedCourse?.chapters || [];

  const handleCourseChange = (value) => {
    setCourseFilter(value);
    setChapterFilter('');
  };

  const handleToggleBookmark = async (material) => {
    try {
      const res = await studyMaterialsService.toggleBookmark(material._id);
      const isBookmarked = res.data?.data?.bookmarked;
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) next.add(material._id);
        else next.delete(material._id);
        return next;
      });
      if (bookmarkedOnly && !isBookmarked) {
        setMaterials((prev) => prev.filter((m) => m._id !== material._id));
      }
      toast.success(isBookmarked ? 'Added to bookmarks' : 'Removed from bookmarks');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update bookmark');
    }
  };

  const openMaterial = (material) => {
    const url = material.type === 'video' ? material.videoUrl : material.fileUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else toast.error('No file available for this material');
  };

  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-ink-light">
          Study Material
        </h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-lightMuted">
          Notes, videos, previous year papers and more — organized by course and chapter.
        </p>
      </div>

      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex w-full items-center gap-2 rounded-full border border-surface-border bg-white px-4 py-2 dark:border-surface-darkBorder dark:bg-surface-dark sm:w-auto sm:max-w-xs">
          <FiSearch className="h-4 w-4 shrink-0 text-ink-lightMuted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-lightMuted"
          />
        </div>

        <select
          value={courseFilter}
          onChange={(e) => handleCourseChange(e.target.value)}
          className="input-field w-full sm:w-auto"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} {c.subject ? `(${c.subject})` : ''}
            </option>
          ))}
        </select>

        <select
          value={chapterFilter}
          onChange={(e) => setChapterFilter(e.target.value)}
          disabled={!chapters.length}
          className="input-field w-full sm:w-auto"
        >
          <option value="">All chapters</option>
          {chapters.map((ch) => (
            <option key={ch._id} value={ch._id}>
              {ch.title}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field w-full sm:w-auto"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <label className="ml-auto flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            role="switch"
            aria-checked={bookmarkedOnly}
            onClick={() => setBookmarkedOnly((prev) => !prev)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              bookmarkedOnly ? 'bg-brand-gradient' : 'bg-black/10 dark:bg-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                bookmarkedOnly ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-ink dark:text-ink-light">Bookmarked only</span>
        </label>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && materials.length === 0 && (
        <EmptyState
          icon={FiFileText}
          title="No study material found"
          description={
            bookmarkedOnly
              ? "You haven't bookmarked anything matching these filters yet."
              : 'Try adjusting your filters or search term.'
          }
        />
      )}

      {!loading && materials.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => {
            const Icon = TYPE_ICONS[material.type] || FiFileText;
            const isBookmarked = bookmarkedIds.has(material._id);
            const openUrl = material.type === 'video' ? material.videoUrl : material.fileUrl;
            return (
              <div key={material._id} className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleBookmark(material)}
                    className="btn-ghost h-9 w-9 shrink-0"
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  >
                    {isBookmarked ? (
                      <BsBookmarkFill className="h-4 w-4 text-brand-500" />
                    ) : (
                      <BsBookmark className="h-4 w-4 text-ink-lightMuted" />
                    )}
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold text-ink dark:text-ink-light line-clamp-2">{material.title}</h3>
                  <p className="mt-0.5 text-xs capitalize text-ink-muted dark:text-ink-lightMuted">
                    {material.course?.name || 'Course'} · {material.type}
                  </p>
                </div>
                {material.description && (
                  <p className="line-clamp-2 text-xs text-ink-muted dark:text-ink-lightMuted">
                    {material.description}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => openMaterial(material)}
                  disabled={!openUrl}
                  className="btn-secondary mt-auto w-full disabled:opacity-40"
                >
                  {material.type === 'video' ? (
                    <>
                      <FiExternalLink className="h-4 w-4" /> Watch Video
                    </>
                  ) : (
                    <>
                      <FiDownload className="h-4 w-4" /> Open File
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Course } from '../types/database';
import { formatPrice } from '../lib/utils';
import { useNavigation } from '../context/NavigationContext';
import { Star } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { navigate } = useNavigation();

  const isFree = course.price === 0;

  return (
    <div
      id={`course-card-${course.id}`}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col h-full"
    >
      {/* Thumbnail with Green Price Badge on Top-Left (Page Model Signature) */}
      <div className="h-44 bg-slate-100 relative overflow-hidden group">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top-Left Green Price Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-bold bg-[#16a34a] text-white rounded-xs shadow-xs tracking-wide">
          {isFree ? 'Gratis' : formatPrice(course.sale_price ?? course.price)}
        </span>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3
            onClick={() => navigate('course-detail', { slug: course.slug })}
            className="font-bold text-slate-900 text-base leading-snug line-clamp-2 hover:text-[#0056D2] transition-colors cursor-pointer"
            title={course.title}
          >
            {course.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-400">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="ml-1 font-bold text-slate-800">{course.rating.toFixed(1)}</span>
            </div>
            <span>•</span>
            <span>{course.students_count} elèv</span>
            <span>•</span>
            <span className="capitalize">{course.level}</span>
          </div>
        </div>

        {/* Action Button: Solid Blue matching page model */}
        <div className="pt-2">
          <button
            id={`btn-view-course-${course.id}`}
            onClick={() => navigate('course-detail', { slug: course.slug })}
            className="w-full py-2.5 px-4 rounded-md font-semibold text-xs text-white bg-[#0056D2] hover:bg-blue-700 active:scale-98 transition-all cursor-pointer text-center block shadow-xs"
          >
            Wè plis detay...
          </button>
        </div>
      </div>
    </div>
  );
};

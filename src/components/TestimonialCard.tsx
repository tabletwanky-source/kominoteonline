import React from 'react';
import { Review } from '../types/database';
import { Star, CheckCircle2, Quote } from 'lucide-react';

interface TestimonialCardProps {
  testimonial: Review;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col justify-between relative group">
      
      {/* Quote decoration */}
      <div className="text-blue-100 absolute top-5 right-5 -z-0 group-hover:text-blue-200 transition-colors">
        <Quote className="w-10 h-10 rotate-180" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Rating stars */}
        <div className="flex items-center gap-1 text-amber-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>

        {/* Comment quote */}
        <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic">
          "{testimonial.comment}"
        </p>
      </div>

      {/* Student identity */}
      <div className="pt-6 mt-4 border-t border-slate-100 flex items-center gap-3 relative z-10">
        <img
          src={testimonial.avatar_url}
          alt={testimonial.student_name}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/20 shadow-2xs"
        />
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-sm text-slate-900">{testimonial.student_name}</h4>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" title="Elèv verifye" />
          </div>
          <p className="text-xs text-slate-500">{testimonial.student_location}</p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AIQuizGenerator from './AIQuizGenerator';
import QuizBuilder from './QuizBuilder';

export function AIGenerateQuizPage() {
    const { courseId, topicId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mb-4"
            >
                ← Back to Edit Course
            </button>
            <AIQuizGenerator 
                courseId={Number(courseId)} 
                topicId={Number(topicId)} 
                instructorId={user?.userId} 
            />
        </div>
    );
}

export function ManualQuizPage() {
    const { courseId, topicId } = useParams();
    const navigate = useNavigate();

    return (
        <QuizBuilder 
            courseId={Number(courseId)} 
            topicId={Number(topicId)} 
            onBack={() => navigate(-1)} 
            onSuccess={() => navigate(-1)} 
        />
    );
}

export function EditQuizPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Try to get topicId and courseId from router state if available
    const topicId = location.state?.topicId;
    const courseId = location.state?.courseId;

    return (
        <QuizBuilder 
            courseId={Number(courseId)} 
            topicId={Number(topicId)} 
            quizId={Number(quizId)}
            onBack={() => navigate(-1)} 
            onSuccess={() => navigate(-1)} 
        />
    );
}

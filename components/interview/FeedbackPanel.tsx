'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Lightbulb, TrendingUp } from 'lucide-react';

interface FeedbackPanelProps {
  contentScore: number;
  clarityScore: number;
  confidenceScore: number;
  completenessScore: number;
  strengths: string[];
  improvements: string[];
  feedbackText: string;
}

export function FeedbackPanel({
  contentScore,
  clarityScore,
  confidenceScore,
  completenessScore,
  strengths,
  improvements,
  feedbackText,
}: FeedbackPanelProps) {
  const overallScore = Math.round(
    contentScore * 0.4 + clarityScore * 0.3 + confidenceScore * 0.2 + completenessScore * 0.1
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getScoreBorder = (score: number) => {
    if (score >= 80) return 'border-green-200';
    if (score >= 60) return 'border-blue-200';
    return 'border-orange-200';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Overall Performance</p>
            <p className="text-4xl font-bold text-blue-600">{overallScore}/100</p>
          </div>
          <div className="text-right">
            <Badge
              variant="default"
              className={overallScore >= 80 ? 'bg-green-600' : overallScore >= 60 ? 'bg-blue-600' : 'bg-orange-600'}
            >
              {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Work'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={`p-4 border ${getScoreBorder(contentScore)}`}>
          <p className="text-xs text-gray-600 font-medium mb-2">Content Quality</p>
          <p className={`text-3xl font-bold ${getScoreColor(contentScore).split(' ')[0]}`}>
            {contentScore}
          </p>
          <p className="text-xs text-gray-500 mt-2">40% weight</p>
        </Card>

        <Card className={`p-4 border ${getScoreBorder(clarityScore)}`}>
          <p className="text-xs text-gray-600 font-medium mb-2">Clarity</p>
          <p className={`text-3xl font-bold ${getScoreColor(clarityScore).split(' ')[0]}`}>
            {clarityScore}
          </p>
          <p className="text-xs text-gray-500 mt-2">30% weight</p>
        </Card>

        <Card className={`p-4 border ${getScoreBorder(confidenceScore)}`}>
          <p className="text-xs text-gray-600 font-medium mb-2">Confidence</p>
          <p className={`text-3xl font-bold ${getScoreColor(confidenceScore).split(' ')[0]}`}>
            {confidenceScore}
          </p>
          <p className="text-xs text-gray-500 mt-2">20% weight</p>
        </Card>

        <Card className={`p-4 border ${getScoreBorder(completenessScore)}`}>
          <p className="text-xs text-gray-600 font-medium mb-2">Completeness</p>
          <p className={`text-3xl font-bold ${getScoreColor(completenessScore).split(' ')[0]}`}>
            {completenessScore}
          </p>
          <p className="text-xs text-gray-500 mt-2">10% weight</p>
        </Card>
      </div>

      {/* Summary Feedback */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-gray-900 mb-2">Feedback</h4>
        <p className="text-gray-700">{feedbackText}</p>
      </Card>

      {/* Strengths */}
      {strengths.length > 0 && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-900">Strengths</h4>
          </div>
          <ul className="space-y-2">
            {strengths.map((strength, i) => (
              <li key={i} className="text-sm text-green-800">
                <span className="font-medium">✓</span> {strength}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Areas for Improvement */}
      {improvements.length > 0 && (
        <Card className="p-6 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-orange-600" />
            <h4 className="font-semibold text-orange-900">Areas for Improvement</h4>
          </div>
          <ul className="space-y-2">
            {improvements.map((improvement, i) => (
              <li key={i} className="text-sm text-orange-800">
                <span className="font-medium">→</span> {improvement}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import pickle
import os

class StudentPerformancePredictor:
    """
    Scikit-Learn ML Predictor for Student Performance & At-Risk Telemetry.
    Predicts:
    - Mastery Score (0 - 100)
    - At-Risk Status (Low, Medium, High Risk)
    - Recommended Learning Path Adjustments
    """
    def __init__(self):
        self.scaler = StandardScaler()
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self._is_trained = False
        self._bootstrap_synthetic_model()

    def _bootstrap_synthetic_model(self):
        """Train an initial baseline model with synthetic education telemetry data."""
        np.random.seed(42)
        # Features:
        # [avg_quiz_score, completion_rate_pct, total_time_hours, quiz_attempts_avg, consecutive_failures]
        X_train = np.array([
            [85, 90, 12, 1.1, 0],
            [92, 95, 15, 1.0, 0],
            [78, 80, 10, 1.3, 0],
            [60, 65, 7,  2.0, 1],
            [45, 40, 4,  2.8, 2],
            [30, 20, 2,  3.5, 3],
            [88, 85, 11, 1.2, 0],
            [50, 55, 5,  2.5, 2],
            [40, 30, 3,  3.0, 3],
            [95, 100, 18, 1.0, 0],
            [70, 75, 8,  1.5, 1],
            [35, 25, 2,  4.0, 4],
        ])
        # Labels: 0 = Low Risk (On Track), 1 = Medium Risk (Needs Guidance), 2 = High Risk (Dropout Danger)
        y_train = np.array([0, 0, 0, 1, 2, 2, 0, 1, 2, 0, 1, 2])

        X_scaled = self.scaler.fit_transform(X_train)
        self.model.fit(X_scaled, y_train)
        self._is_trained = True

    def predict(self, avg_quiz_score: float, completion_rate_pct: float, total_time_hours: float, quiz_attempts_avg: float = 1.2, consecutive_failures: int = 0) -> dict:
        """
        Input student features and return ML risk analysis + mastery index.
        """
        features = np.array([[avg_quiz_score, completion_rate_pct, total_time_hours, quiz_attempts_avg, consecutive_failures]])
        features_scaled = self.scaler.transform(features)
        
        risk_class = self.model.predict(features_scaled)[0]
        probs = self.model.predict_proba(features_scaled)[0]

        risk_levels = ["Low Risk (On Track)", "Medium Risk (Needs Reinforcement)", "High Risk (Intervention Needed)"]
        risk_tier = risk_levels[risk_class]

        # Calculate composite Mastery Index
        mastery_index = round((0.5 * avg_quiz_score) + (0.35 * completion_rate_pct) + (15 * min(1.0, total_time_hours / 10.0)), 1)
        mastery_index = min(100.0, max(0.0, mastery_index))

        # Generate automated AI recommendation triggers
        recommendations = []
        if risk_class == 2:
            recommendations.append("Trigger AI Mentor outreach to offer simplified explanations.")
            recommendations.append("Generate foundational diagnostic quiz with hint assistance.")
            recommendations.append("Recommend reviewing prerequisite module materials.")
        elif risk_class == 1:
            recommendations.append("Suggest additional practice exercises for topic reinforcement.")
            recommendations.append("Offer interactive flashcards before next attempt.")
        else:
            recommendations.append("Learner is excelling! Recommend advanced capstone project & peer mentoring role.")

        return {
            "masteryIndex": mastery_index,
            "riskTier": risk_tier,
            "riskCode": int(risk_class),
            "confidenceScore": round(float(probs[risk_class]), 2),
            "probabilities": {
                "lowRisk": round(float(probs[0]), 2),
                "mediumRisk": round(float(probs[1]), 2),
                "highRisk": round(float(probs[2]), 2)
            },
            "recommendations": recommendations
        }

# Global Singleton Instance
ml_predictor = StudentPerformancePredictor()

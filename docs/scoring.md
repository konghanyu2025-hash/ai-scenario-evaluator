# Scoring

The scoring system is intentionally mixed rather than fully subjective.

## Rubric

Default dimensions:

- Task completion: 25
- Accuracy: 20
- Constraint following: 20
- Risk control: 20
- Usability: 15

Each dimension is scored from 0 to 5. Weighted scores are normalized to 100.

## Judge Models

Judge models receive the scenario, task, constraints, rubric, and candidate output. They must return JSON with:

```json
{
  "dimensionScores": [
    {
      "dimensionId": "task_completion",
      "score": 4.2,
      "reason": "Reason"
    }
  ],
  "overallComment": "Comment",
  "riskFlags": []
}
```

Multiple judges are averaged. Disagreement lowers confidence.

## Deterministic Checks

Current checks:

- non-empty output
- valid JSON when required
- max length when a max length constraint exists
- rough language match
- overclaiming signals

Failed deterministic checks add penalties and risk flags.

## Confidence

Confidence considers:

- number of successful judges
- judge disagreement
- deterministic check pass rate
- candidate call failure
- scenario difficulty

Output values: `low`, `medium`, `high`.

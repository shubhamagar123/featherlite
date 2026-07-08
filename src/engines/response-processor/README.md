# Response Processor

Post-processes every LLM response before it reaches product code. Never calls the model itself.

## Pipeline

```
RawLLMResponse
    ↓
ResponseParser        — format detection + JSON/tool-call parsing
    ↓
Validators            — schema + safety (BLOCKING / WARNING / INFO)
    ↓
Rules                 — merge outcomes into a single verdict
    ↓
Detectors             — follow-up, reminder, memory, relationship, notification, moment
    ↓
ProcessedResponse     — status + validation + detections
    ↓
LLM_RESPONSE_GENERATED event (via EventEngine)
```

## Detections emitted

| Kind                     | Trigger                             |
|--------------------------|-------------------------------------|
| `FOLLOW_UP`              | question mark, "would you like", "next time" |
| `REMINDER`               | "remind me to …"                    |
| `MEMORY_CANDIDATE`       | durable-fact assertions or JSON list |
| `RELATIONSHIP_UPDATE`    | affection / trust / conflict signals |
| `NOTIFICATION_CANDIDATE` | "I'll message you when …"           |
| `MOMENT_CANDIDATE`       | "special", "first time", "anniversary" |

## Safety categories

`SELF_HARM`, `VIOLENCE`, `HATE`, `SEXUAL`, `ILLEGAL`, `PRIVACY_LEAK`, `MEDICAL_ADVICE`, `LEGAL_ADVICE`, `FINANCIAL_ADVICE`.

Blocking issues reject the response outright; warnings annotate the outcome for downstream engines.

# CornellPulse recommendation and crisis-safety boundary

CornellPulse is a resource-navigation tool. Its local rules are not a diagnosis, therapy, medical advice, suicide-risk determination, validated screening instrument, or clinically validated assessment. The application cannot monitor a person, contact responders, or dispatch help.

## Implemented boundary

- Ordinary resource suggestions use non-clinical selections such as academic, financial, housing, identity, and talk preferences.
- Crisis routing is separate from ordinary suggestions. Explicit first-person statements can display urgent contact choices; ambiguous language or a mood score of 1–2 displays a qualified support check-in instead.
- Negated phrases and obvious educational/research contexts are excluded from direct keyword escalation. This reduces simple false positives but cannot reliably interpret intent, context, sarcasm, quotations, language variation, or changes in risk.
- Free text is processed only in the open browser page and is not transmitted or placed in check-in history.
- 911, Cornell Public Safety, 988, and Cornell Health are presented as different services rather than interchangeable recommendations.

## Official wording checked on 2026-08-02

- [Cornell Health emergencies and after-hours care](https://health.cornell.edu/get-care/emergencies-after-hours-care): call 911 or Cornell's Public Safety Communications Center for an emergency; Cornell Health provides 24/7 consultation for physical or mental health concerns.
- [Cornell Health 24/7 phone consultation](https://health.cornell.edu/get-care/247-phone-consultation): 607-255-5155 connects students with medical or mental health consultation; emergencies should go to 911.
- [Cornell Division of Public Safety resources](https://publicsafety.cornell.edu/resources): 607-255-1111 reaches the 24/7 Public Safety Communications Center for dispatch and campus public-safety response.
- [988 Suicide & Crisis Lifeline](https://988lifeline.org/) and [SAMHSA's 988 factsheet](https://www.samhsa.gov/sites/default/files/988-factsheet.pdf): 988 supports call and text contact with a crisis counselor; immediate physical safety threats require emergency response.
- [Crisis Text Line](https://www.crisistextline.org/): in the United States, text HOME to 741741 to connect with a volunteer Crisis Counselor.

## Required professional review before launch

A licensed mental-health professional or Cornell Health must review and approve:

- every phrase category, negation rule, ambiguity rule, and the risk of false negatives and false positives;
- whether any automated free-text interpretation should exist at all;
- the mood-score boundary and the wording/order of urgent versus non-urgent options;
- the distinction and escalation sequence among 911, 988, Cornell Health, Cornell Public Safety, and location-specific services;
- suitability for Cornell Ithaca, Cornell Tech, Weill Cornell, students outside the United States, and people who cannot call or text;
- accessibility, trauma-informed language, localization, and testing with representative users;
- an operational process and review cadence for resource names, numbers, hours, SMS behavior, and official guidance.

No feature flag or successful software test substitutes for that review.

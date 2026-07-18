# Palette's UX Journal 🎨

This journal logs critical UX and accessibility learnings from working on the Antigravity Autonomous Robotics Ecosystem Command Center.

## 2024-11-21 - [Keyboard & Visual Button States]
**Learning:** In highly interactive single-page dashboards with real-time operations, interactive control buttons (such as search buttons or pipeline triggers) lack proper keyboard navigation cues (like focus rings) and visual feedback states (like disabled representation). Standardizing focus-visible and disabled button states prevents user confusion and makes key actions keyboard-accessible. Additionally, input fields lacking "Enter" key trigger support frustrate users who expect natural keyboard form-submission patterns.
**Action:** Always styling `:focus-visible` for outline rings, adding `:disabled` hover-blocking CSS rules, and registering "Enter" keydown event listeners on text input fields alongside manual click buttons.

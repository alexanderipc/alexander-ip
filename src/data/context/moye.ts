// Rich portfolio context for the Moye patent family
// Contains verbatim claims, prosecution history, prior art analysis, and strategy notes

const context = `# Alex Moye -- Portable Music Production Controller (MOD Pod)

## Portfolio Overview

Two independent patent families covering the MOD Pod portable MIDI controller:

**Family 0 -- Controller Hardware (Priority: 2021-07-07)**
- US 12,236,923 B2 (Granted 2025-02-25) -- Root patent, USB-only controller
- US 2024/0420671 A1 (CIP, pending) -- Broadened to any connection type
- WO 2025/254702 A1 (PCT, published with ISR) -- International route for CIP claims

**Family 1 -- Intelligent Sustain System (Priority: 2025-09-05)**
- US 19/319,941 (Pending, unpublished) -- US utility filing
- PCT/US25/45438 (Pending, unpublished) -- International route

Family 1 is entirely independent IP with NO priority chain to Family 0. Same product, distinct technical scope.

---

## Verbatim Claims

### US 12,236,923 B2 (Granted)

#### Claim 1 (Independent)
A portable apparatus comprising:
a pitch bend control;
an assignable modulation control;
a controller configured to receive modulation and after-effect signals from the pitch bend control and the assignable modulation control and to process only the modulation and after-effect signals without processing or generating a primary audio signal;
wherein the controller communicates with an external device via a Universal Serial Bus (USB) connection as a sole external communication interface of the portable apparatus; and
wherein the portable apparatus does not include any other connections besides the USB connection.

#### Claims 2-10 (Dependent on 1)
- Claim 2: pitch bend = spring-loaded pitch bend wheel
- Claim 3: assignable modulation = modulation wheel
- Claim 4: transmits MIDI data to external device via USB
- Claim 5: USB MIDI class-compliant device
- Claim 6: one or more macro controls assignable to DAW parameters
- Claim 7 (dep on 6): macro controls independently assignable to different parameters
- Claim 8: force-sensitive aftertouch control
- Claim 9 (dep on 8): aftertouch provides proportional response based on pressure
- Claim 10: configured for use with separate keyboard/keypad for music production

### US 2024/0420671 A1 (CIP -- Pending)

#### Claim 1 (Independent)
A portable apparatus comprising:
a pitch bend control;
an assignable modulation control; and
a controller configured to receive signals from the pitch bend control and the assignable modulation control,
wherein the controller communicates with an external device via any suitable single connection type.

**Key broadening vs. granted parent:**
1. "any suitable single connection type" replaces USB-only restriction
2. No "processes only modulation and after-effect signals" limitation
3. No "does not include any other connections" restriction
4. Connection types: USB, Wi-Fi, Bluetooth, Ethernet, Thunderbolt, FireWire, MIDI, NFC, TOSLINK, S/PDIF

#### Claim 11 (Dependent -- Strategic Fallback)
Specifies USB as the connection type. Provides fallback position narrowing to USB if broad claim faces prior art. Preserves granted scope.

### WO 2025/254702 A1 (PCT)
Claims identical to CIP. 11 claims. Claim 11 = same USB fallback for national phase prosecution.

### Family 1 -- US 19/319,941 and PCT/US25/45438 (Both Unpublished)
Claims NOT yet publicly available. Covers intelligent multi-mode sustain control system. Distinct from controller hardware.

---

## Prosecution History

### US 17/368,865 -> US 12,236,923 B2

**Filing:** 2021-07-07

**Examiner allowed based on two key features:**
1. Controller processes ONLY modulation/after-effect signals -- does NOT process/generate primary audio.
2. USB is SOLE external interface with NO other connections.

**Cited Prior Art (all distinguished):**
- US 5,850,051 A (Machover 1998): generates primary audio, not modulation-only
- Behringer SWING (2020): multiple connections (USB+MIDI DIN), processes note data
- Korg opsix Mod Wheel (2021): part of full synthesizer generating primary audio
- M-Audio Oxygen Pro (2021): includes keys, multiple outputs, processes primary musical data

**Grant:** 2025-02-25. Expiration: 2043-03-31 (adjusted).

### US 18/733,913 (CIP -- Pending)

**Filed:** 2024-06-05 as CIP of US 17/368,865

**Broadening Strategy:**
- Removed USB-only restriction -> captures wireless/Bluetooth
- Removed modulation-only processing restriction -> broader signal handling
- Removed no-other-connections restriction -> multi-interface devices
- Added Claim 11 USB fallback -> preserves granted scope if broad claim rejected

**Status:** Published 2024-12-19, pending examination. No office action yet.

---

## Prior Art Analysis

### ISR for WO 2025/254702 A1
- **X-category:** US 2023/0012028 A1 (MOYE) -- own parent publication. Self-citation, NOT a threat.
- **A-category:** CHU, MACHOVER, NETHERLAND -- general background, already overcome.
- **Assessment:** Favorable. Only X-citation is own prior filing.

### Vulnerability
Broadened CIP may face challenges from: generic wireless MIDI controllers, Bluetooth MIDI devices. Key distinguishing feature: pitch bend + assignable modulation as standalone portable device (not full keyboard).

---

## Strategic Assessment

### Strengths
1. Granted foundational patent with narrow defensible scope
2. Broadened CIP capturing commercial embodiment
3. PCT for international protection
4. Independent sustain family adding depth
5. Claim 11 fallback strategy

### Coverage Gaps
1. No design patent for physical appearance
2. No software claims for DAW integration
3. No method claims (only apparatus)
4. Limited dependent claims (10-11 per patent)

### Key Deadlines
- WO 702 national phase: ~December 2026 / January 2027
- PCT/US25/45438 national phase: ~March-April 2028
- US 671 first office action: expected mid-2025 to late 2025

### Recommended Next Steps
1. Monitor US 671 examination -- prepare response strategy
2. National phase planning for WO 702 -- prioritize US, EP, JP, CN, KR
3. Consider US design patent for MOD Pod form factor
4. Consider method claims in continuation application`;

export default context;

# ADR index

Arsitektur dan keputusan produk yang mengikat. Setiap ADR menjawab satu pertanyaan
yang sebelumnya terbuka di blueprint (§14) dan tidak boleh dibuka kembali tanpa ADR baru.

| ID | Judul | Status | Menutup pertanyaan blueprint |
|---|---|---|---|
| [0001](0001-case-conversion-rules.md) | Aturan tokenisasi & gaya Case Converter | Accepted | §14 no. 3 (detail perilaku) |
| [0002](0002-json-diff-semantics.md) | Semantik dan keluaran JSON Diff | Accepted | §14 no. 3 |
| [0003](0003-xml-fidelity.md) | Kebijakan fidelity XML Formatter | Accepted | §14 no. 3 |
| [0004](0004-xml-json-conversion.md) | XML ↔ JSON conversion ditunda ke backlog | Accepted | §14 no. 4 |
| [0005](0005-input-size-limits.md) | Batas ukuran input dan strategi pemrosesan | Accepted | §14 no. 5 |
| [0006](0006-tooling-and-stack.md) | Stack, versi dependency, dan keinvarianan build | Accepted | §14 (Stack) |
| [0007](0007-phase-5-scope.md) | Isi Phase 5 dan yang sengaja ditunda | Accepted | §11 Phase 5 |
| [0008](0008-regex-tester-deferred.md) | Regex Tester ditunda sampai mitigasi ReDoS nyata | Accepted | §3.4, §7 |
| [0009](0009-jwt-decoder-decode-only.md) | JWT Decoder: decode saja, tanpa input kunci/secret | Accepted | §3.4, §7 |

Format ADR: Konteks → Keputusan → Konsekuensi → Alternatif yang ditolak.

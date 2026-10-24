export interface ParsedLine {
  characters: string[];
  line: string;
  sung?: boolean;
}

// Character names come from the user, but scripts routinely contain speakers
// the user did not list. A standalone upper-case line that looks like a name
// ("CINDERELLA", "CP/RP") is treated as a speaker header and registered on
// the fly, so an incomplete list no longer swallows a whole character.
export const parseScript = (script: string, characterNames: string[]) => {
  const lines = script.split(/\n/);
  const parsedLines: ParsedLine[] = [];
  const knownCharacters = [...characterNames];
  let currentCharacters: string[] = [];
  let currentLine = "";

  const multiCharSeparators = /\s*[&\/,]\s*/;

  // Helper function to normalize text by removing spaces
  const normalizeText = (text: string) =>
    text.toLowerCase().replace(/\s+/g, "");

  // Remove punctuation, then check whether what remains is all upper-case
  const isAllCaps = (text: string) => {
    const cleanedText = text.replace(/[^a-zA-Z]/g, "");
    return cleanedText.length > 0 && cleanedText === cleanedText.toUpperCase();
  };

  // Helper function to check if a line is sung (all caps)
  const isSungLine = (text: string) => isAllCaps(text);

  // Sung lyrics are upper-case too, so shape is what separates them: a
  // speaker header is short and never ends in sentence punctuation.
  // Drop a trailing colon and notes like "(CON'T)" from a speaker header
  const stripHeaderNote = (text: string) =>
    text
      .replace(/:\s*$/, "")
      .replace(/\s*\([^)]*\)\s*$/, "")
      .trim();

  const isKnownCharacter = (text: string) =>
    knownCharacters.some((name) => normalizeText(name) === normalizeText(text));

  const looksLikeCharacterHeader = (text: string) => {
    const core = stripHeaderNote(text);
    if (!core || !isAllCaps(core)) return false;
    if (/[.,!?;…-]$/.test(core)) return false;
    return core.split(/\s+/).length <= 3;
  };

  // Resolve a header to canonical character names, registering unseen ones
  const resolveHeaderCharacters = (header: string) => {
    const core = stripHeaderNote(header);
    return core
      .split(multiCharSeparators)
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const known = knownCharacters.find(
          (name) => normalizeText(name) === normalizeText(part),
        );
        if (known) return known;
        knownCharacters.push(part);
        return part;
      });
  };

  const flushCurrentLine = () => {
    if (currentCharacters.length > 0 && currentLine.trim()) {
      parsedLines.push({
        characters: [...currentCharacters],
        line: currentLine.trim(),
      });
    }
    currentLine = "";
  };

  for (const [index, line] of lines.entries()) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue; // Skip empty lines
    if (trimmedLine.startsWith("#")) continue; // Song cue, e.g. "#18 HAPPY SAD"

    // Check for multiple character:line patterns within a single line
    const characterPattern =
      knownCharacters.length > 0
        ? new RegExp(
            `\\b(${knownCharacters
              .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
              .join("|")})\\s*:`,
            "gi",
          )
        : null;

    const matches = characterPattern
      ? [...trimmedLine.matchAll(characterPattern)]
      : [];

    if (matches.length > 1) {
      // Multiple character patterns found in this line - split them up
      flushCurrentLine();
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        if (!match) continue;

        const nextMatch = matches[i + 1];
        const characterName = match[1];
        if (!characterName) continue;

        const startIndex = (match.index ?? 0) + match[0].length;
        const endIndex = nextMatch ? nextMatch.index ?? 0 : trimmedLine.length;
        const dialogue = trimmedLine.substring(startIndex, endIndex).trim();

        const foundCharacter = knownCharacters.find(
          (name) => normalizeText(name) === normalizeText(characterName),
        );

        if (foundCharacter && dialogue) {
          const isSung = isSungLine(dialogue);
          parsedLines.push({
            characters: [foundCharacter],
            line: dialogue,
            ...(isSung && { sung: true }),
          });
          currentCharacters = [foundCharacter];
        }
      }
      continue;
    }

    // Check for "CHARACTER: line" format, including "CHAR1/CHAR2: line"
    const colonIndex = trimmedLine.indexOf(":");
    if (colonIndex > 0) {
      const potentialCharacter = trimmedLine.substring(0, colonIndex).trim();
      const potentialLine = trimmedLine.substring(colonIndex + 1).trim();

      if (potentialLine) {
        const potentialCharacters = potentialCharacter
          .split(multiCharSeparators)
          .map((c) => c.trim())
          .filter((c) => c.length > 0);

        const allKnown =
          potentialCharacters.length > 0 &&
          potentialCharacters.every((pc) =>
            knownCharacters.some(
              (name) => normalizeText(name) === normalizeText(pc),
            ),
          );

        if (allKnown || looksLikeCharacterHeader(potentialCharacter)) {
          flushCurrentLine();
          const resolved = resolveHeaderCharacters(potentialCharacter);
          const isSung = isSungLine(potentialLine);
          parsedLines.push({
            characters: resolved,
            line: potentialLine,
            ...(isSung && { sung: true }),
          });
          currentCharacters = resolved;
          continue;
        }
      }
    }

    // A standalone name line ("CINDERELLA", "CP/RP") opens that speaker's lines.
    // An unlisted name only counts between plain lines; inside a run of caps it is a lyric.
    const nextLine =
      lines
        .slice(index + 1)
        .find((l) => l.trim())
        ?.trim() ?? "";
    const prevLine =
      lines
        .slice(0, index)
        .reverse()
        .find((l) => l.trim())
        ?.trim() ?? "";
    const headerParts = stripHeaderNote(trimmedLine).split(multiCharSeparators);
    if (
      looksLikeCharacterHeader(trimmedLine) &&
      (headerParts.every(isKnownCharacter) ||
        (!!nextLine && !isAllCaps(nextLine) && !isAllCaps(prevLine)))
    ) {
      flushCurrentLine();
      currentCharacters = resolveHeaderCharacters(trimmedLine);
      continue;
    }

    // Upper-case, but not a speaker header, so it is a sung lyric
    if (isSungLine(trimmedLine)) {
      flushCurrentLine();
      if (currentCharacters.length > 0) {
        parsedLines.push({
          characters: [...currentCharacters],
          line: trimmedLine,
          sung: true,
        });
      }
      continue;
    }

    // Regular dialogue for the current speaker
    if (currentCharacters.length > 0) {
      currentLine += (currentLine ? " " : "") + trimmedLine;
    }
  }

  // Save the last lines
  flushCurrentLine();

  return parsedLines;
};

// Renames or merges characters: each key becomes its value, and a line never lists one name twice
export const applyRenames = (
  lines: ParsedLine[],
  renames: Record<string, string>,
): ParsedLine[] =>
  lines.map((line) => ({
    ...line,
    characters: [
      ...new Set(line.characters.map((name) => renames[name] ?? name)),
    ],
  }));

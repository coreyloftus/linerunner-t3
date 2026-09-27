\version "2.24.0"

% Public domain melody ("Twinkle, Twinkle, Little Star"), first 8 measures.
% Dotted rhythms in measures 3 and 7 and a rest in measure 8 test rhythm reading.

\header {
  title = "Twinkle, Twinkle, Little Star"
  tagline = ##f
}

melody = \relative c' {
  \clef treble
  \key c \major
  \time 4/4
  \tempo 4 = 100
  c4 c g' g | a a g2 |
  f4. f8 e4 e | d d c2 |
  g'4 g f f | e e d2 |
  g4. g8 f4 f | e e d r |
  \bar "|."
}

words = \lyricmode {
  Twin -- kle, twin -- kle, lit -- tle star,
  How I won -- der what you are!
  Up a -- bove the world so high,
  Like a dia -- mond in the sky.
}

\score {
  <<
    \new Voice = "mel" { \melody }
    \new Lyrics \lyricsto "mel" { \words }
  >>
  \layout { }
}

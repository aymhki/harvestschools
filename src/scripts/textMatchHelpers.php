<?php

function tm_strip_arabic_diacritics($s) {
    return preg_replace('/[\x{0610}-\x{061A}\x{064B}-\x{065F}\x{0670}\x{06D6}-\x{06ED}\x{0640}]/u', '', $s);
}

function tm_unify_arabic_letters($s) {
    $map = [
        'أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا', 'ٱ' => 'ا',
        'ى' => 'ي', 'ئ' => 'ي',
        'ة' => 'ه',
        'ؤ' => 'و',
        'ء' => '',
        '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
        '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
        '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
        '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
    ];
    return strtr($s, $map);
}

function tm_transliterate_arabic($s) {
    $s = tm_strip_arabic_diacritics($s);
    $s = tm_unify_arabic_letters($s);

    $map = [
        'ا' => 'a', 'ب' => 'b', 'ت' => 't', 'ث' => 'th', 'ج' => 'j',
        'ح' => 'h', 'خ' => 'kh', 'د' => 'd', 'ذ' => 'th', 'ر' => 'r',
        'ز' => 'z', 'س' => 's', 'ش' => 'sh', 'ص' => 's', 'ض' => 'd',
        'ط' => 't', 'ظ' => 'z', 'ع' => 'a', 'غ' => 'gh', 'ف' => 'f',
        'ق' => 'q', 'ك' => 'k', 'ل' => 'l', 'م' => 'm', 'ن' => 'n',
        'ه' => 'h', 'و' => 'w', 'ي' => 'y', 'ٓ' => '', 'پ' => 'p',
        'چ' => 'ch', 'ژ' => 'zh', 'گ' => 'g', 'ك' => 'k',
    ];

    return strtr($s, $map);
}

function tm_strip_latin_accents($s) {
    $map = [
        'à'=>'a','á'=>'a','â'=>'a','ã'=>'a','ä'=>'a','å'=>'a','ā'=>'a',
        'è'=>'e','é'=>'e','ê'=>'e','ë'=>'e','ē'=>'e',
        'ì'=>'i','í'=>'i','î'=>'i','ï'=>'i','ī'=>'i',
        'ò'=>'o','ó'=>'o','ô'=>'o','õ'=>'o','ö'=>'o','ō'=>'o',
        'ù'=>'u','ú'=>'u','û'=>'u','ü'=>'u','ū'=>'u',
        'ñ'=>'n','ç'=>'c','ş'=>'s','ğ'=>'g',
    ];
    return strtr(mb_strtolower($s, 'UTF-8'), $map);
}

function tm_latin_skeleton($token) {
    $token = preg_replace('/[^a-z]/', '', $token);
    if ($token === '') { return ''; }
    $token = str_replace(['ph','ck','gh'], ['f','k','g'], $token);
    $first = $token[0];
    $rest  = substr($token, 1);
    $rest  = preg_replace('/[aeiouy]/', '', $rest);
    $skeleton = $first . $rest;
    $skeleton = preg_replace('/(.)\1+/', '$1', $skeleton);

    return $skeleton;
}

function tm_normalize($s) {
    $s = (string)$s;
    $s = tm_strip_arabic_diacritics($s);
    $s = tm_unify_arabic_letters($s);
    $s = tm_strip_latin_accents($s);
    $s = preg_replace('/[^\p{L}\p{N}]+/u', ' ', $s);
    $s = preg_replace('/\s+/u', ' ', $s);
    return trim($s);
}


function tm_latin_key($s) {
    $normalized = tm_normalize($s);
    $transliterated = tm_transliterate_arabic($normalized);
    $tokens = preg_split('/\s+/', trim($transliterated));
    $skeletons = [];
    foreach ($tokens as $tok) {
        $sk = tm_latin_skeleton($tok);
        if ($sk !== '') { $skeletons[] = $sk; }
    }
    sort($skeletons);
    return implode(' ', $skeletons);
}

function tm_tokens($s) {
    $n = tm_normalize($s);
    if ($n === '') { return []; }
    return preg_split('/\s+/', $n);
}

function tm_similarity($a, $b) {
    if ($a === '' && $b === '') { return 1.0; }
    if ($a === '' || $b === '') { return 0.0; }
    if ($a === $b) { return 1.0; }

    $len = max(strlen($a), strlen($b));
    $dist = levenshtein($a, $b);
    return 1.0 - ($dist / $len);
}

function tm_name_score($query, $candidate) {
    $qn = tm_normalize($query);
    $cn = tm_normalize($candidate);
    if ($qn === '') { return 0.0; }

    if ($qn === $cn) { return 1.0; }

    if (mb_strlen($qn) >= 2 && mb_strpos($cn, $qn) !== false) {
        return 0.9;
    }

    $qKey = tm_latin_key($query);
    $cKey = tm_latin_key($candidate);
    if ($qKey !== '' && $qKey === $cKey) { return 0.85; }
    if ($qKey !== '' && $cKey !== '' && mb_strpos(' ' . $cKey . ' ', ' ' . $qKey . ' ') !== false) {
        return 0.8;
    }

    $qTokens = array_values(array_filter(explode(' ', tm_transliterate_arabic($qn))));
    $cTokens = array_values(array_filter(explode(' ', tm_transliterate_arabic($cn))));
    if (empty($qTokens) || empty($cTokens)) { return 0.0; }

    $qSkel = array_map('tm_latin_skeleton', $qTokens);
    $cSkel = array_map('tm_latin_skeleton', $cTokens);

    $matched = 0;
    $fuzzyAccum = 0.0;
    foreach ($qSkel as $qs) {
        if ($qs === '') { continue; }
        $best = 0.0;
        foreach ($cSkel as $cs) {
            if ($cs === '') { continue; }
            if ($qs === $cs) { $best = 1.0; break; }
            $sim = tm_similarity($qs, $cs);
            if ($sim > $best) { $best = $sim; }
        }
        if ($best >= 0.99) { $matched++; }
        $fuzzyAccum += $best;
    }

    $coverage = $fuzzyAccum / max(count($qSkel), 1);
    $exactRatio = $matched / max(count($qSkel), 1);
    return min(1.0, 0.5 * $exactRatio + 0.6 * $coverage);
}

function tm_phone_digits($s) {
    $s = tm_unify_arabic_letters((string)$s);
    return preg_replace('/\D+/', '', $s);
}


function tm_phone_nsn($s) {
    $d = tm_phone_digits($s);
    if ($d === '') { return ''; }

    if (strpos($d, '00') === 0) { $d = substr($d, 2); }

    $countryCodes = ['966', '971', '974', '973', '968', '965', '20', '2'];
    foreach ($countryCodes as $cc) {
        if (strpos($d, $cc) === 0 && strlen($d) - strlen($cc) >= 6) {
            $d = substr($d, strlen($cc));
            break;
        }
    }

    if (strlen($d) > 7 && $d[0] === '0') { $d = substr($d, 1); }

    return $d;
}

function tm_phone_match($a, $b, $tailLen = 9) {
    $na = tm_phone_nsn($a);
    $nb = tm_phone_nsn($b);
    if ($na === '' || $nb === '') { return false; }

    if ($na === $nb) { return true; }

    $ta = substr($na, -$tailLen);
    $tb = substr($nb, -$tailLen);

    return strlen($ta) >= 7 && $ta === $tb;
}

function tm_phone_looks_valid($s) {
    return strlen(tm_phone_digits($s)) >= 7;
}

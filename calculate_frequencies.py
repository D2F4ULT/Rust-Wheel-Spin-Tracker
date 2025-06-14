from collections import Counter
import math

def calculate_frequencies(spins):
    number_freq = {}
    for n in spins:
        if n in number_freq:
            number_freq[n] += 1
        else:
            number_freq[n] = 1

    total = len(spins)
    color_freq = {'red': 0, 'black': 0, 'green': 0}

    for n in spins:
        if n == 0:
            color_freq['green'] += 1
        elif n % 2 == 1:
            color_freq['red'] += 1
        else:
            color_freq['black'] += 1

    number_freq_pct = {}
    color_freq_pct = {}

    if total > 0:
        for k in number_freq:
            number_freq_pct[k] = number_freq[k] / total * 100
        for k in color_freq:
            color_freq_pct[k] = color_freq[k] / total * 100
    else:
        # Avoid division by zero
        number_freq_pct = {}
        color_freq_pct = {'red': 0, 'black': 0, 'green': 0}

    return number_freq_pct, color_freq_pct
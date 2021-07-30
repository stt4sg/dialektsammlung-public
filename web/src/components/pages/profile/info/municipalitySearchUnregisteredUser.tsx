/* eslint-disable @typescript-eslint/camelcase */
import { Localized } from '@fluent/react';
import { LabeledInput } from '../../../ui/ui';
import * as React from 'react';
import { ChangeEvent, Component } from 'react';
import './muni.css';
import { animated, config as springConfig, Transition } from 'react-spring';
import IntlMessageFormat from 'intl-messageformat';
import { BehaviorSubject } from 'rxjs';

type MessageListContent = string | MessageList;

/** Recursive type for storing translated strings in objects */
interface MessageList {
  [key: string]: MessageListContent;
}

interface LocalisedMessagesList {
  [key: string]: MessageList;
}

// Type: either standard municipality or electoral district
export interface Municipality {
  readonly GDENR: number;
  readonly ORTNAME: string;
  readonly PLZ4: number;
  readonly GDENAMK: string;
  readonly KTKZ: string;
  readonly NORMORTSNAME: string;
  readonly NORMGEMEINDE: string;
  readonly TYPE: number;
}

export interface Props {
  /** Which year to use for the municipality data. For the 2019 data, this
   *  would be `2019`. */
  municipalityData: string;

  /** Handler for when a municipality is selected by the user */
  onSelectionHandler: (municipality: Municipality) => void;

  /** Locale to use */
  locale: 'de';
}

interface State {
  isLoading: boolean;
  results: Municipality[];
  value: string;
  error: null | 'error.noResultsByZip' | 'error.noResultsByName' | 'error.municipalitiesNotDownloaded';
  municipalities: Municipality[];
}

/** All localised strings for the component */
const MESSAGES = {
  de: {
    meta: {
      forComponent: 'municipalitySearchUnregisteredUser',
      language: 'German',
    },
    label: '',
    placeholder: '',
    error: {
      noResultsByZip: 'Es wurde keine Gemeinde mit dieser Postleitzahl gefunden.',
      noResultsByName: 'Es wurde keine Gemeinde mit diesem Namen gefunden.',
      municipalitiesNotDownloaded:
        'Die Gemeindeliste konnte nicht heruntergeladen werden. Die Suche steht zur Zeit nicht zur Verfügung.',
    },
    list: {
      municipalityPrefix: 'Gemeinde',
      electoralDistrictPrefix: 'Wahlkreis',
    },
    results: '{numResults, plural, =0 {Keine Resultate} one {Ein Resultat} other {# Resultate}}',
  },
};

/**
 * Create a translation Service function, using the provided MessageList and
 * the currenty locale string.
 * @param messageList - The object containing the translated strings. The first
 *   level keys are the locale strings, then you're free to use whathever IDs
 *   you need to identify your strings.
 * @param locale - The locale string (i.e. 'en', 'de', 'fr' …)
 */
const translationServiceFactory = (messageList: LocalisedMessagesList, locale: string) => {
  return (key: string | null) => {
    if (key == null) {
      return '';
    }
    return (
      key.split('.').reduce(
        // @ts-ignore
        (messages: MessageListContent, prop: string) => messages[prop],
        messageList[locale]
      ) || ''
    );
  };
};

class MunicipalityDownloadError extends Error {}

/** RegEx to look whether a string starts with a number */
const startsWithNumber = /^\d/;

/** Regex to look whether a string just contains text */
const containsOnlyLetters = /^\D+$/;

/** Regex that extracts four numbers, presumably a ZIP code */
const containsFourDigits = /\d{4}/;

/**
 * Check whether the results should be shown or not.
 *
 * There need to *some* results to be shown. Since we animate the objects, we
 * also need a an upper bound – no need to overwhelm the users (and the
 * browser) with hundreds of results. No one is going to need that.
 */
function showResults(results: any[]) {
  return results.length > 0 && results.length < 100;
}

/**
 * Basen is based on https://yarnpkg.com/package/@ta-interaktiv/react-municipality-search
 */
export class MunicipalitySearchUnregisteredUser extends Component<Props, State> {
  public static defaultProps = {
    locale: 'de',
  };

  public state = {
    isLoading: true,
    // @ts-ignore
    results: [],
    value: '',
    // @ts-ignore
    error: null,
    // @ts-ignore
    municipalities: [],
  };

  private resetComponent = () => {
    this.setState({
      isLoading: false,
      results: [],
      value: '',
    });
  };

  private filterList = (searchTerm: string) => {
    let results: Municipality[] = [];

    if (typeof searchTerm !== 'undefined') {
      searchTerm = searchTerm.trim();
    }

    // Only start filtering once we have enough data
    if (typeof searchTerm !== 'undefined' && searchTerm.length > 1 && this.state.municipalities !== null) {
      // In case where we have four digits in the search term, we look for those
      const digitsResultsArray = containsFourDigits.exec(searchTerm);
      const { municipalities } = this.state;
      if (digitsResultsArray) {
        const digits = digitsResultsArray[0];
        results = municipalities.filter((municipality: Municipality) => municipality.PLZ4.toString() === digits);

        if (results.length < 1) {
          this.setState({ error: 'error.noResultsByZip' });
        }
      } else if (startsWithNumber.test(searchTerm)) {
        // in case it starts with a number, we're assuming the reader is looking
        // for a zip code
        results = municipalities.filter((municipality: Municipality) =>
          RegExp(`^${searchTerm}`).test(municipality.PLZ4.toString())
        );

        if (results.length < 1) {
          this.setState({ error: 'error.noResultsByZip' });
        }
      } else if (containsOnlyLetters.test(searchTerm)) {
        // In case it is letters, we look for placenames

        // Do some simple sanitizing to remove some RegEx gotchas
        // Also, we need to use two escape hatches because JS removes one? WTF?
        const sanitizedSearchTerm = searchTerm.replace('.', '\\.');
        const r = RegExp(sanitizedSearchTerm, 'i');
        results = municipalities.filter(
          (municipality: Municipality) =>
            r.test(municipality.ORTNAME) ||
            r.test(municipality.GDENAMK) ||
            r.test(municipality.NORMORTSNAME) ||
            r.test(municipality.NORMGEMEINDE)
        );

        if (results.length < 1) {
          this.setState({ error: 'error.noResultsByName' });
        }
      }
    }

    return this.removeDuplicates(results);
  };

  // In case I live in Zurich or Winterthur, I guess that
  // I don't want to see all PLZs associated with all electoral
  // districts but the electoral districts only.
  private removeDuplicates(arr: Municipality[]): Municipality[] {
    const map = new Map();
    arr.forEach(v => {
      if (!v.TYPE) {
        map.set(v.PLZ4 + v.ORTNAME + v.GDENR, v);
      } else {
        map.set(v.GDENR, v);
      }
    });
    return [...map.values()];
  }

  private handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    this.setState({ isLoading: true, value });
    if (typeof value !== 'undefined' && value.length < 1) {
      return this.resetComponent();
    }
    const results = this.filterList(value).sort((a, b) => {
      const nameSorted = a.ORTNAME.localeCompare(b.ORTNAME);
      return nameSorted ? nameSorted : a.PLZ4 - b.PLZ4;
    });
    if (results.length > 0) {
      this.setState({ error: null, isLoading: false, results });
    }
    this.setState({ results, isLoading: false });
  };

  /**
   * The datapipeline (Didier Orel) would like to store
   * the information about the NPA the users choose before
   * accessing to the generated story.
   */
  private sendToDataPipeline = (plz4: string) => {
    const BASE_URL = 'https://w.tda.io/b/votation';
    const ZIP = '?zip=' + plz4;
    const url = BASE_URL + ZIP;
    return window
      .fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        credentials: 'include',
      })
      .then(response => {
        console.log(response);
      })
      .catch(error => {
        console.log(error);
      });
  };

  public componentDidMount() {
    // Download municipalities list
    // This is a preliminary measure, before we get a proper API
    const mun = require('./municipalities.json');
    this.setState({
      isLoading: false,
      municipalities: mun,
    });
    return new BehaviorSubject(mun).asObservable();
  }

  public render() {
    const { value, results } = this.state;

    /** Translation Service
     * Needs to be inside the render function in order to be re-initialized
     * once the context has changed.
     */
    const t = translationServiceFactory(MESSAGES, this.props.locale);

    // result string formatter
    const resultString = new IntlMessageFormat(MESSAGES[this.props.locale].results, this.props.locale + '-CH');
    const labelContent = () => {
      if (this.state.error) {
        return t(this.state.error);
      }
      if (!!value && value.length >= 2) {
        return resultString.format({ numResults: results.length });
      }
      return t('label');
    };
    const labelDirection = window.matchMedia('screen and (max-width: 599px)').matches
      ? 'top pointing'
      : 'left pointing';
    return (
      <div className={`municipality-search municipalitySearch margin`}>
        <Localized id="profile-form-municipality-search" attrs={{ label: true, title: true }}>
          <LabeledInput
            id="search"
            type="text"
            className={`prompt flexInput`}
            placeholder={'PLZ oder Ort eingeben'}
            value={value}
            disabled={this.state.error === 'error.municipalitiesNotDownloaded'}
            onChange={this.handleSearchChange}
            showHelpIcon={true}
          />
        </Localized>
        <div>
          <label htmlFor="search" className={`ui ${this.state.error ? 'red' : 'basic grey'} ${labelDirection} label`}>
            {labelContent()}
          </label>
        </div>
        {showResults(results) && (
          <div className={`results results force-scroll`}>
            {!!value && showResults(results) && (
              <Transition
                native
                items={results}
                keys={(result: Municipality) => result.PLZ4 + result.GDENR + result.ORTNAME}
                from={{ transform: 'translate(0,-20px)', opacity: 0 }}
                enter={{ transform: 'translate(0,0px)', opacity: 1 }}
                leave={{ transform: 'translate(0, 60px)', opacity: 0 }}
                config={springConfig.gentle}>
                {(props: object, result: Municipality) => (
                  <animated.div
                    onClick={() => {
                      this.props.onSelectionHandler(result);
                      // this.sendToDataPipeline(result.PLZ4)
                      return this.resetComponent();
                    }}
                    onKeyUp={e => {
                      if (e.key === 'Enter' || e.key === 'Space') {
                        this.props.onSelectionHandler(result);
                        // this.sendToDataPipeline(result.PLZ4)
                        return this.resetComponent();
                      }
                    }}
                    className={`result result`}
                    style={props}
                    tabIndex={0}>
                    <div className={'resultHeader'}>
                      {!result.TYPE && <span className={'resultPlz'}>{result.PLZ4}</span>} {result.ORTNAME}
                    </div>
                    <div className={'resultMeta'}>
                      {result.TYPE === 1 ? t('list.electoralDistrictPrefix') : t('list.municipalityPrefix')}{' '}
                      {result.GDENAMK}
                    </div>
                  </animated.div>
                )}
              </Transition>
            )}
          </div>
        )}
      </div>
    );
  }
}

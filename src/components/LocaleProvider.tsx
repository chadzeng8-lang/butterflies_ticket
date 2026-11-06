"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Locale = "cn" | "hk";
type Converter = (text: string) => string;

const STORAGE_KEY = "ticketing-locale";
const LocaleContext = createContext<{ locale: Locale; toggleLocale: () => void } | null>(null);
const CONVERTIBLE_ATTRIBUTES = ["alt", "aria-label", "placeholder", "title"];

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("cn");
  const localeRef = useRef(locale);
  const converters = useRef<Record<Locale, Converter> | null>(null);
  const convertDocument = useRef<() => void>(() => {});
  const ensureConverters = useRef<null | (() => Promise<void>)>(null);

  const changeLocale = useCallback((next: Locale) => {
    localeRef.current = next;
    setLocale(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.dataset.locale = next;
    document.documentElement.lang = next === "cn" ? "zh-CN" : "zh-HK";
  }, []);

  const toggleLocale = useCallback(() => {
    changeLocale(localeRef.current === "cn" ? "hk" : "cn");
  }, [changeLocale]);

  useEffect(() => {
    const savedLocale = localStorage.getItem(STORAGE_KEY);
    if (savedLocale === "cn" || savedLocale === "hk") changeLocale(savedLocale);
  }, [changeLocale]);

  useEffect(() => {
    let active = true;
    const originalText = new WeakMap<Text, string>();
    const renderedText = new WeakMap<Text, string>();
    const originalAttributes = new WeakMap<Element, Map<string, { source: string; rendered: string }>>();
    let cleanupObserver = () => {};

    function shouldConvert(node: Node) {
      const parent = node.parentElement;
      return !parent?.closest("script, style, noscript, textarea, code, pre, [data-no-translate]");
    }

    function convertText(node: Text) {
      if (!shouldConvert(node) || !converters.current) return;
      let source = originalText.get(node);
      if (source === undefined || node.nodeValue !== renderedText.get(node)) {
        source = node.nodeValue ?? "";
        originalText.set(node, source);
      }
      const rendered = converters.current[localeRef.current](source);
      renderedText.set(node, rendered);
      if (node.nodeValue !== rendered) node.nodeValue = rendered;
    }

    function convertAttributes(element: Element) {
      if (!converters.current) return;
      let attributes = originalAttributes.get(element);
      if (!attributes) {
        attributes = new Map();
        originalAttributes.set(element, attributes);
      }
      for (const name of CONVERTIBLE_ATTRIBUTES) {
        const value = element.getAttribute(name);
        if (value === null) continue;
        const previous = attributes.get(name);
        const source = previous && value === previous.rendered ? previous.source : value;
        const rendered = converters.current[localeRef.current](source);
        attributes.set(name, { source, rendered });
        if (value !== rendered) element.setAttribute(name, rendered);
      }
    }

    function convertSubtree(root: Node) {
      if (!converters.current) return;
      if (root.nodeType === Node.TEXT_NODE) {
        convertText(root as Text);
      } else if (root.nodeType === Node.ELEMENT_NODE) {
        const element = root as Element;
        convertAttributes(element);
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let text: Node | null;
        while ((text = walker.nextNode())) convertText(text as Text);
        element.querySelectorAll("*").forEach(convertAttributes);
      }
    }

    function startObserver() {
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === "characterData" && record.target instanceof Text) {
            convertText(record.target);
          } else if (record.type === "childList") {
            record.addedNodes.forEach(convertSubtree);
          } else if (record.type === "attributes" && record.target instanceof Element) {
            convertAttributes(record.target);
          }
        }
      });
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: CONVERTIBLE_ATTRIBUTES,
        characterData: true,
        childList: true,
        subtree: true,
      });
      cleanupObserver = () => observer.disconnect();
    }

    ensureConverters.current = async () => {
      if (converters.current || !active) return;
      const { Converter } = await import("opencc-js");
      if (!active) return;
      converters.current = {
        cn: Converter({ from: "hk", to: "cn" }),
        hk: Converter({ from: "cn", to: "hk" }),
      };
      convertDocument.current = () => convertSubtree(document.body);
      startObserver();
      convertDocument.current();
    };

    // Source copy is Simplified Chinese. Convert on mount so any leftover
    // Traditional (or a restored HK preference) is applied consistently.
    void ensureConverters.current?.().then(() => {
      if (active) convertDocument.current();
    });

    return () => {
      active = false;
      cleanupObserver();
      convertDocument.current = () => {};
      ensureConverters.current = null;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.locale = locale;
    document.documentElement.lang = locale === "cn" ? "zh-CN" : "zh-HK";

    const load = ensureConverters.current;
    if (!load) return;
    void load().then(() => {
      convertDocument.current();
    });
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, toggleLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}

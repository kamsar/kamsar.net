---
title: Announcing Sitecore JSS XSLT Support
date: 2018-04-01 00:06:66
categories: JSS
---

Sitecore Team X is proud to announce the final public release of Sitecore JavaScript Services (JSS) with full XSLT 3.0 support!

## Why XSLT 3.0?

XSLT 3.0 allows for [JSON transformations](https://www.xml.com/articles/2017/02/14/why-you-should-be-using-xslt-30/), so you can use the full power of modern JSS while retaining the XSLT developer experience that Site Core developers know and love.

Our XSLT 3.0 engine allows for client-side rendering by transforming hard-to-read JSON into plain, sensible XML using XSLT 3.0 standards-compliant JSON-to-XML transformations. Instead of ugly JSON, your JSS renderings can simple, easy to read XML like this:

```xml
<j:map xmlns:j="http://www.w3.org/2013/XSL/json">
  <j:map key="fields">
    <j:map key="title">
      <j:map key="value">
        <j:string key="editable">SiteCore Experience Platform + JSS + XSLT</j:string>
        <j:string key="value">SiteCore Experience Platform + JSS + XSLT</j:string>
      </j:map>
    </j:map>
  </j:map>
</j:map>
```

It's just as simple to make a JSS XSLT to transform your rendering output. Check out this super simple "hello world" sample:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:math="http://www.w3.org/2005/xpath-functions/math"
    xmlns:xd="http://www.oxygenxml.com/ns/doc/xsl"
    xmlns:SiteCore="http://www.SiteCore.com/demandMore/xslt"
    xmlns:h="http://www.w3.org/1999/xhtml"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:j="http://www.w3.org/2005/xpath-functions"
    exclude-result-prefixes="xs math xd h SiteCore"
    version="3.0"
    expand-text="yes"
    >
    <xsl:output  method="text" indent="yes" media-type="text/json" omit-xml-declaration="yes"/>
    <xsl:variable name="fields-a" select="json-to-xml(/)"/>
    <xsl:template match="/">
       <xsl:variable name="fields-b">
           <xsl:apply-templates select="$fields-a/*"/>
       </xsl:variable>
       {xml-to-json($fields-b,map{'indent':true()})}
    </xsl:template>
    <xsl:template match="/j:map">
            <j:map>
                <j:array key="fields">
                    <xsl:apply-templates select="j:map[@key='fields']/j:map" mode="rendering"/>
                </j:array>
            </j:map>
    </xsl:template>
    <xsl:template match="j:map" mode="rendering">
        <j:map>
            <j:string key="title">{j:string[@key='title:value']||' '||j:string
[@key='title:editable']}</j:string>
            <xsl:if test="j:boolean [@key='experienceEditor']">
            <j:string key="editable">{j:string
[@key='editable']/text()}</j:string>
            </xsl:if>
        </j:map>
    </xsl:template>
</xsl:stylesheet>
```

JSON transformations allow XSLT 3.0 to be a transformative force on the modern web. Expect to see recruiters demand 10 years of XSLT 3.0 experience for Site-core candidates within the next year - this is a technology you will not want to miss out on learning.

## Dynamic XSLT with VBScript

Modern JavaScript is way too difficult, so we've implemented a feature that lets you define dynamic XSLT templates using ultra-modern VBScript:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:math="http://www.w3.org/2005/xpath-functions/math"
    xmlns:xd="http://www.oxygenxml.com/ns/doc/xsl"
    xmlns:SiteCore="http://www.SiteCore.com/demandMore/xslt"
    xmlns:h="http://www.w3.org/1999/xhtml"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:j="http://www.w3.org/2005/xpath-functions"
    exclude-result-prefixes="xs math xd h SiteCore"
    version="3.0"
    expand-text="yes"
    >
    <xsl:output  method="text" indent="yes" media-type="text/json" omit-xml-declaration="yes"/>
    <xsl:variable name="fields-a" select="json-to-xml(/)"/>
    <xsl:template match="/">
       <xsl:variable name="fields-b">
           <xsl:apply-templates select="$fields-a/*"/>
       </xsl:variable>
       {xml-to-json($fields-b,map{'indent':true()})}
    </xsl:template>
    <xsl:template match="/j:map" type="text/vbscript">
      Dim txtValue = xmlns.SiteCore.rendering.title.value
      Dim txtEditable = xmlns.SiteCore.rendering.title.value

      Sub xsltRender(txtVBProgrammers, txtAreDim)
        document.write(txtVBProgrammers)
      End Sub
    </xsl:template>
    <xsl:template match="j:map" mode="rendering">
        <j:map>
            <j:string key="title">{j:string[@key='title:value']||' '||j:string
[@key='title:editable']}</j:string>
            <xsl:if test="j:boolean [@key='experienceEditor']">
            <j:string key="editable">{j:string
[@key='editable']/text()}</j:string>
            </xsl:if>
        </j:map>
    </xsl:template>
</xsl:stylesheet>
```

With a quick piece of simple VBScript like that, you'll be making awesome JSS pages like this one in no time!

{% asset_img xslt.png %}

## How can I get this XSLT goodness?

Glad you asked. Download it [right here](https://goo.gl/EpcFui)!

## What's next for JSS

The Sitecore JSS team is always looking for opportunities to improve JSS and make it compatible with the most modern technologies. Experimentation is already under way to add ColdFusion scripting support for XSLT 3 JSS renderings, and enable PHP server-side rendering for your SiteCore solutions.

Just another way that we help you succeed in your Site core implementations.

[Send us feedback on our roadmap](https://goo.gl/2jTvPX)
<!DOCTYPE xml>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<!--  Put through http://xslttest.appspot.com/ to determine output is as desired -->

<xsl:template match="/customer">
   
    <application>
        <first_name>
        <xsl:value-of select="fname"/>
        </first_name>
		<last_name>
		<xsl:value-of select="lname"/>
		</last_name>
		<phone1>
		<xsl:value-of select="substring-before(phone,'-')" />
		</phone1>
	 	<phone2>
		<xsl:value-of select="substring(phone,4,4)" />
		</phone2>
		<phone3>
		<xsl:value-of select="substring(phone,9)" />
		</phone3> 
		<dob>
		<xsl:value-of select="concat(dob_m, '/', dob_d, '/', dob_y)" />
		</dob>
		<email_domain>
		<xsl:value-of select="replace(email, '.*@', '')" />
		</email_domain>
		<status>
	    <xsl:choose>
                <xsl:when test="active = 'TRUE'">Active</xsl:when>
                <xsl:otherwise>Inactive</xsl:otherwise>
         </xsl:choose>
	     </status>
	     <repeat>
	     <xsl:value-of select="substring(type,1,1)"/>
	     </repeat>
    </application>
</xsl:template>

</xsl:stylesheet>

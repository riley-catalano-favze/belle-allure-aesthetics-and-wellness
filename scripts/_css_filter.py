import re
HDR = re.compile(r'header|site-search|nav-toggle|menu-open|#site-nav|menu-btn|nav-svc|nav-book|nav-link|header-|hamburger|search-btn|mobile-menu', re.I)

def top_blocks(css):
    """Yield (prelude, body, start, end) for top-level blocks in css."""
    i=0; n=len(css); out=[]
    while i<n:
        j=css.find('{',i)
        if j<0: break
        pre=css[i:j]
        depth=1; k=j+1
        while k<n and depth>0:
            if css[k]=='{': depth+=1
            elif css[k]=='}': depth-=1
            k+=1
        body=css[j+1:k-1]
        out.append((pre.strip(), body, i, k))
        i=k
    return out

def filter_css(css, keep_fn):
    """Return CSS text containing only top-level rules (and @media blocks) that match keep_fn; for @media, keep only matching inner rules."""
    kept=[]
    for pre,body,s,e in top_blocks(css):
        if pre.startswith('@media') or pre.startswith('@supports'):
            inner=[]
            for ipre,ibody,_,_ in top_blocks(body):
                if keep_fn(ipre):
                    inner.append(f'{ipre}{{{ibody}}}')
            if inner: kept.append(f'{pre}{{{chr(10).join(inner)}}}')
        elif pre.startswith('@'):
            continue
        else:
            if keep_fn(pre): kept.append(f'{pre}{{{body}}}')
    return '\n'.join(kept)

def remove_css(css, drop_fn):
    """Return css with top-level rules matching drop_fn removed; @media blocks have matching inner rules removed."""
    out=[]; last=0
    for pre,body,s,e in top_blocks(css):
        out.append(css[last:s])
        if pre.startswith('@media') or pre.startswith('@supports'):
            newbody=[]
            for ipre,ibody,_,_ in top_blocks(body):
                if not drop_fn(ipre): newbody.append(f'{ipre}{{{ibody}}}')
            out.append(f'{pre}{{{chr(10).join(newbody)}}}' if newbody else '')
        elif pre.startswith('@'):
            out.append(css[s:e])
        else:
            if not drop_fn(pre): out.append(css[s:e])
        last=e
    out.append(css[last:])
    return ''.join(out)

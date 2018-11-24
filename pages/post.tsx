import React, { FunctionComponent } from "react";
import { withRouter, WithRouterProps } from "next/router";
import Link from 'next/link';

import 'highlight.js/styles/monokai-sublime.css';

interface PostRenderingProps {
  title: string;
  bodyHtml: string;
}

const PostWrapper: FunctionComponent<WithRouterProps> = (props) => {
  let pageJson: PostRenderingProps | null = null;
  if (props.router.query &&  props.router.query.fullUrl) {
    pageJson = require(`../content${props.router.query.fullUrl}.json`);
  }

  return (
    <div>
      <PostBody {...pageJson as PostRenderingProps} />
    </div>
  );
}

const PostBody: FunctionComponent<PostRenderingProps> = (props) => {
  return (
    <div>
      <h1>Post: {props.title}</h1>
      <Link href="/posts"><a>Back to posts</a></Link>
      <div dangerouslySetInnerHTML={{ __html: props.bodyHtml }} />
    </div>
  );
}

export default withRouter(PostWrapper);
